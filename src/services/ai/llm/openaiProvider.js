import OpenAI from 'openai';
import { config } from '../../../config/env.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export class OpenAIProvider {
  /**
   * Generates a conversational response.
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {string} params.model
   */
  static async generateChatResponse({ systemPrompt, messages, model = 'gpt-3.5-turbo' }) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OPENAI_API_KEY found, returning a dummy response.');
      return 'Yeh ek dummy OpenAI response hai, kyunki API key set nahi hai. (This is a dummy response because API key is missing.)';
    }

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 150, // Keep responses short for conversational AI
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw error;
    }
  }
}
