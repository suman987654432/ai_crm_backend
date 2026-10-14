import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey || 'dummy_key');

export class GeminiProvider {
  /**
   * Generates a conversational response using Google Gemini.
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {string} params.model
   */
  static async generateChatResponse({ systemPrompt, messages, model = 'gemini-2.5-flash' }) {
    if (!config.geminiApiKey) {
      console.warn('No GEMINI_API_KEY found, returning a dummy response.');
      return 'Yeh ek dummy Gemini response hai, kyunki API key set nahi hai.';
    }

    try {
      const generativeModel = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemPrompt
      });

      // Convert standard messages format [{role: 'user'|'assistant', content: '...'}]
      // to Gemini chat format [{role: 'user'|'model', parts: [{text: '...'}]}]
      // We take everything except the last user message as history
      const formattedHistory = [];
      let latestUserMessage = '';

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === 'system') continue; // system prompt handled via systemInstruction
        
        if (i === messages.length - 1 && msg.role === 'user') {
            latestUserMessage = msg.content;
        } else {
            formattedHistory.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
      }

      const chat = generativeModel.startChat({
        history: formattedHistory,
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(latestUserMessage || 'Hello');
      return result.response.text();
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  }

  static async generateChatStream({ systemPrompt, messages, model = 'gemini-2.5-flash' }) {
    if (!config.geminiApiKey) {
      throw new Error("No GEMINI_API_KEY");
    }

    const generativeModel = genAI.getGenerativeModel({
      model: model,
      systemInstruction: systemPrompt
    });

    const formattedHistory = [];
    let latestUserMessage = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'system') continue;
      
      if (i === messages.length - 1 && msg.role === 'user') {
          latestUserMessage = msg.content;
      } else {
          formattedHistory.push({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
          });
      }
    }

    const chat = generativeModel.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(latestUserMessage || 'Hello');
    return result.stream;
  }
}
