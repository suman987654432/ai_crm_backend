import { sql } from '../../config/database.js';
import { OpenAIProvider } from '../ai/llm/openaiProvider.js';
import { SarvamProvider as SarvamTTSProvider } from '../ai/tts/sarvamProvider.js';
import { SarvamSTTProvider } from '../ai/stt/sarvamProvider.js';

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
    ws
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
        console.log(`[Session ${sessionId}] Interruption detected`);
        sendStatus(ws, 'listening');
      }
    } catch (err) {
      console.error(`[Session ${sessionId}] Error parsing WS message:`, err);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket closed for session: ${sessionId}`);
    sessions.delete(sessionId);
    // Mark session as ended in DB
    sql`UPDATE agent_test_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}`.catch(console.error);
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

    // Optionally send greeting if configured
    if (aiConfig.greeting_message) {
      await generateAndPlayAIResponse(sessionState, aiConfig.greeting_message, true);
    } else {
      sendStatus(ws, 'listening');
    }

  } catch (err) {
    console.error('Error starting session:', err);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to initialize session.' }));
  }
};

const handleUserAudio = async (sessionState, base64Audio) => {
  const { ws, sessionId, agentConfig } = sessionState;
  
  if (!agentConfig) return;

  try {
    sendStatus(ws, 'processing'); // Processing STT

    // 1. STT (Speech to Text)
    const userText = await SarvamSTTProvider.transcribeAudio(base64Audio, agentConfig.language);
    
    if (!userText || userText.trim() === '') {
      sendStatus(ws, 'listening');
      return;
    }

    // Emit Live Transcript to UI
    ws.send(JSON.stringify({ type: 'user_transcript', text: userText }));
    
    // Save User Message to DB
    await sql`
      INSERT INTO agent_test_messages (session_id, role, content)
      VALUES (${sessionId}, 'user', ${userText});
    `;

    // Add to local context
    sessionState.messages.push({ role: 'user', content: userText });

    // 2. Generate LLM Response
    sendStatus(ws, 'thinking');
    await generateAndPlayAIResponse(sessionState, null, false);

  } catch (err) {
    console.error('Audio processing error:', err);
    sendStatus(ws, 'listening');
  }
};

const generateAndPlayAIResponse = async (sessionState, forcedResponseText = null, isGreeting = false) => {
  const { ws, sessionId, agentConfig, messages } = sessionState;
  
  try {
    let aiText = forcedResponseText;

    if (!aiText) {
      // Build System Prompt
      const systemPrompt = `You are an AI assistant.
Your Name: ${agentConfig.name}
Your Primary Goal: ${agentConfig.primary_goal}
Instructions: ${agentConfig.ai.system_prompt}
Language/Tone: Respond primarily in ${agentConfig.language}. Keep responses conversational, concise, and under 2-3 sentences max. Do NOT use markdown.`;

      // Call OpenAI
      aiText = await OpenAIProvider.generateChatResponse({
        systemPrompt,
        messages: messages.slice(-10), // keep last 10 messages for context
        model: agentConfig.ai.llm_model
      });
    }

    // Save AI Message to DB
    await sql`
      INSERT INTO agent_test_messages (session_id, role, content)
      VALUES (${sessionId}, 'assistant', ${aiText});
    `;

    sessionState.messages.push({ role: 'assistant', content: aiText });

    // Emit AI Live Transcript
    ws.send(JSON.stringify({ type: 'ai_transcript', text: aiText }));

    // 3. TTS (Text to Speech)
    sendStatus(ws, 'speaking');
    const ttsProvider = new SarvamTTSProvider();
    const audioBase64 = await ttsProvider.previewVoice({
      text: aiText,
      voiceId: agentConfig.voice.voice_id,
      language: 'hi-IN', // Sarvam requires this or en-IN
      speed: 1.0 // Future: parse from config
    });

    // Send Audio to Browser
    ws.send(JSON.stringify({ type: 'audio', audio: audioBase64 }));

    // Wait for a simulated duration of the audio or let the frontend manage state
    // For V1, the frontend will tell us when audio is done playing, or we just switch to listening immediately.
    // Actually, sending 'listening' right away lets frontend buffer the audio and block recording until playback finishes.

  } catch (err) {
    console.error('AI Generation error:', err);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to generate AI response.' }));
  }
};

const sendStatus = (ws, status) => {
  ws.send(JSON.stringify({ type: 'status', status }));
};
