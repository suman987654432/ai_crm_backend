import { config } from '../../../config/env.js';

export class SarvamSTTProvider {
  /**
   * Converts base64 audio (wav or mp3) to text.
   * Note: This uses a mocked REST request structure assuming a standard /v1/speech-to-text API.
   * If Sarvam's API requires multipart form data, it handles it via native fetch.
   */
  static async transcribeAudio(base64Audio, language = 'hi-IN') {
    if (!config.sarvamApiKey) {
      console.warn('No SARVAM_API_KEY found, returning dummy transcription.');
      return 'Yeh ek dummy STT transcription hai.';
    }

    try {
      const startTime = Date.now();
      const buffer = Buffer.from(base64Audio, 'base64');
      
      const formData = new FormData();
      formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'audio.webm'); 
      let langCode = 'hi-IN';
      if (typeof language === 'string') {
        if (language.toLowerCase().includes('english') && language.toLowerCase().includes('hindi')) {
          langCode = 'unknown'; // Auto-detect for code-mixed / Hinglish scenarios
        } else if (language.toLowerCase().includes('english')) {
          langCode = 'en-IN';
        }
      }
      formData.append('language_code', langCode);

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': config.sarvamApiKey
        },
        body: formData
      });

      const sttDuration = Date.now() - startTime;
      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(`Sarvam STT failed: ${JSON.stringify(data)}`);
      }

      console.log(`[LATENCY] STT (Sarvam): ${sttDuration}ms | Transcribed: "${data.transcript || ''}"`);
      return { transcript: data.transcript || '', durationMs: sttDuration };
    } catch (error) {
      console.error('Sarvam STT error:', error);
      throw error;
    }
  }
}
