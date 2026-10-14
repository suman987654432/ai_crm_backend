import { sql } from '../../config/database.js';
import { OpenAIProvider } from '../ai/llm/openaiProvider.js';
import { GeminiProvider } from '../ai/llm/geminiProvider.js';
import { SarvamProvider as SarvamTTSProvider } from '../ai/tts/sarvamProvider.js';
import { SarvamSTTProvider } from '../ai/stt/sarvamProvider.js';
import logger from '../../utils/logger.js';

// Map of active sessions
const sessions = new Map();

/**
 * Handles a new WebSocket connection for a test session.
 */
export const handleNewConnection = (ws, sessionId) => {
  let sessionState = {
    sessionId,
    agentId: null,
    agentConfig: null,
    messages: [], // Conversation history
    ws,
    ttsStreamer: null
  };

  sessions.set(sessionId, sessionState);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'start') {
        await handleStartSession(sessionState, message);
      } else if (message.type === 'user_audio') {
        await handleUserAudio(sessionState, message.audio);
      } else if (message.type === 'interruption') {
        // User interrupted the TTS playback
        logger.info(`[Session ${sessionId}] Interruption detected`);
        sendStatus(ws, 'listening');
      }
    } catch (err) {
      logger.error(`[Session ${sessionId}] Error parsing WS message:`, err);
    }
  });

  ws.on('close', () => {
    logger.info(`WebSocket closed for session: ${sessionId}`);
    sessions.delete(sessionId);
    if (sessionState.ttsStreamer) {
      sessionState.ttsStreamer.close();
    }
    // Mark session as ended in DB
    sql`UPDATE agent_test_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}`.catch(e => logger.error(e));
  });
};

const handleStartSession = async (sessionState, message) => {
  const { ws, sessionId } = sessionState;
  const agentId = message.agentId;
  sessionState.agentId = agentId;

  try {
    sendStatus(ws, 'initializing');
    
    // 1. Load Agent Config
    const [agent] = await sql`SELECT * FROM agents WHERE id = ${agentId}`;
    const [aiConfig] = await sql`SELECT * FROM agent_ai_configs WHERE agent_id = ${agentId}`;
    const [voiceConfig] = await sql`SELECT * FROM agent_voice_configs WHERE agent_id = ${agentId}`;
    
    if (!agent || !aiConfig || !voiceConfig) {
      ws.send(JSON.stringify({ type: 'error', message: 'Incomplete agent configuration.' }));
      ws.close();
      return;
    }

    sessionState.agentConfig = {
      ...agent,
      ai: aiConfig,
      voice: voiceConfig
    };

    // Initialize Database Session
    await sql`
      INSERT INTO agent_test_sessions (id, organization_id, agent_id, status)
      VALUES (${sessionId}, ${agent.organization_id}, ${agentId}, 'connected')
      ON CONFLICT (id) DO UPDATE SET status = 'connected';
    `;
    
    // Initialize TTS Streamer once for the whole session
    sessionState.ttsStreamer = new SarvamTTSStreamer(
      sessionState.agentConfig.language === 'en-IN' ? 'en-IN' : 'hi-IN',
      sessionState.agentConfig.voice.voice_id || 'shubh',
      (base64) => {
        ws.send(JSON.stringify({ type: 'audio', audio: base64 }));
      }
    );

    // Optionally send greeting if configured
    if (aiConfig.greeting_message) {
      await generateAndPlayAIResponse(sessionState, aiConfig.greeting_message, true);
    } else {
      sendStatus(ws, 'listening');
    }

  } catch (err) {
    logger.error('Error starting session:', err);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to initialize session.' }));
  }
};

const handleUserAudio = async (sessionState, base64Audio) => {
  const { ws, sessionId, agentConfig } = sessionState;
  
  if (!agentConfig) return;

  const interactionStartTime = Date.now();

  try {
    sendStatus(ws, 'processing'); // Processing STT

    // 1. STT (Speech to Text)
    const sttResult = await SarvamSTTProvider.transcribeAudio(base64Audio, agentConfig.language);
    const userText = typeof sttResult === 'object' ? sttResult.transcript : sttResult;
    
    if (!userText || userText.trim() === '') {
      sendStatus(ws, 'listening');
      return;
    }

    // Emit Live Transcript to UI
    ws.send(JSON.stringify({ type: 'user_transcript', text: userText }));
    
    // Save User Message to DB without blocking
    sql`
      INSERT INTO agent_test_messages (session_id, role, content)
      VALUES (${sessionId}, 'user', ${userText});
    `.catch(e => logger.error('DB Insert Error (user message):', e));
    
    logger.info(`[Session ${sessionId}] User: ${userText}`);

    // Add to local context
    sessionState.messages.push({ role: 'user', content: userText });

    // 2. Generate LLM Response
    sendStatus(ws, 'thinking');
    await generateAndPlayAIResponse(sessionState, null, false, interactionStartTime);

  } catch (err) {
    logger.error('Audio processing error:', err);
    sendStatus(ws, 'listening');
  }
};

const { SarvamTTSStreamer } = await import('../ai/tts/sarvamTTSStreamer.js');

const generateAndPlayAIResponse = async (sessionState, forcedResponseText = null, isGreeting = false, interactionStartTime = null) => {
  const { ws, sessionId, agentConfig, messages } = sessionState;
  
  try {
    let aiText = forcedResponseText;
    let fullAiResponse = '';

    if (aiText) {
       fullAiResponse = aiText;
       ws.send(JSON.stringify({ type: 'ai_transcript', text: aiText }));
       
       sendStatus(ws, 'speaking');
       const streamer = sessionState.ttsStreamer;
       streamer.sendText(aiText);
       streamer.flush();
    } else {
      const systemPrompt = `You are an AI assistant.
Your Name: ${agentConfig.name}
Your Primary Goal: ${agentConfig.primary_goal}
Instructions: ${agentConfig.ai.system_prompt}
Language/Tone: You MUST dynamically match the user's spoken language. If the user speaks to you in English, respond in English. If the user speaks in Hindi or Hinglish, respond in Hindi or Hinglish. Keep responses conversational, concise, and under 2-3 sentences max. Do NOT use markdown.`;

      sendStatus(ws, 'speaking'); // We start speaking soon

      const streamer = sessionState.ttsStreamer;
      // Reset streamer timing markers for new response
      if (streamer) {
        streamer.firstChunkTime = null;
        streamer.sendTextTime = null;
      }

      const llmStartTime = Date.now();
      let firstTokenReceived = false;

      if (agentConfig.ai.llm_provider === 'gemini') {
        // Enforce the fastest low-latency model available on your API key
        const modelName = 'gemini-3.5-flash-lite';

        const stream = await GeminiProvider.generateChatStream({
          systemPrompt,
          messages: messages.slice(-6), // Keep context concise for fast prompt evaluation
          model: modelName
        });

        let ttsBuffer = '';
        const sentenceBoundaryRegex = /[\.\?\!\,\n।]/; // Matches end of phrase or sentence

        for await (const chunk of stream) {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            const ttft = Date.now() - llmStartTime;
            console.log(`[LATENCY] LLM Time-to-First-Token (TTFT): ${ttft}ms`);
          }

          const chunkText = chunk.text();
          fullAiResponse += chunkText;
          ttsBuffer += chunkText;

          // If the buffer has reached a natural pause (comma, period, question mark, newline, purna viram)
          // or is getting long (> 50 chars), send the sentence to TTS
          if (sentenceBoundaryRegex.test(chunkText) || ttsBuffer.length > 50) {
            streamer.sendText(ttsBuffer);
            ttsBuffer = '';
          }

          ws.send(JSON.stringify({ type: 'ai_transcript', text: fullAiResponse }));
        }

        const llmTotalTime = Date.now() - llmStartTime;
        console.log(`[LATENCY] LLM Total Generation Time: ${llmTotalTime}ms`);

        // Send any remaining characters
        if (ttsBuffer.trim()) {
          streamer.sendText(ttsBuffer);
        }
      } else {
        // Fallback for OpenAI (not streaming implemented here yet)
        aiText = await OpenAIProvider.generateChatResponse({
          systemPrompt,
          messages: messages.slice(-10),
          model: agentConfig.ai.llm_model
        });
        const llmTotalTime = Date.now() - llmStartTime;
        console.log(`[LATENCY] LLM Total Generation Time (OpenAI): ${llmTotalTime}ms`);
        fullAiResponse = aiText;
        streamer.sendText(aiText);
        ws.send(JSON.stringify({ type: 'ai_transcript', text: fullAiResponse }));
      }
      
      streamer.flush();

      if (interactionStartTime) {
        const totalTurnaround = Date.now() - interactionStartTime;
        console.log(`[LATENCY] ★ Total Turnaround Time (Audio In -> Speech Out): ${totalTurnaround}ms`);
      }
    }

    sql`
      INSERT INTO agent_test_messages (session_id, role, content)
      VALUES (${sessionId}, 'assistant', ${fullAiResponse});
    `.catch(e => logger.error('DB Insert Error (assistant message):', e));
    
    logger.info(`[Session ${sessionId}] AI: ${fullAiResponse}`);
    sessionState.messages.push({ role: 'assistant', content: fullAiResponse });

  } catch (err) {
    logger.error('AI Generation error:', err);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to generate AI response.' }));
  }
};

const sendStatus = (ws, status) => {
  ws.send(JSON.stringify({ type: 'status', status }));
};
