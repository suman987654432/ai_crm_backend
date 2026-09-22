/**
 * Base VoiceProvider interface.
 * All TTS providers (Sarvam, ElevenLabs, OpenAI) must implement this interface.
 */
export class VoiceProvider {
  /**
   * Return a list of available voices from this provider.
   * @returns {Promise<Array<{voiceId: string, voiceName: string, gender: string, supportedLanguages: string[], provider: string}>>}
   */
  async getVoices() {
    throw new Error('Method not implemented.');
  }

  /**
   * Generate an audio preview for a specific voice.
   * @param {Object} params
   * @param {string} params.text - The text to speak.
   * @param {string} params.voiceId - The provider's voice ID.
   * @param {string} params.language - The target language code.
   * @param {number} params.speed - Speech speed multiplier.
   * @returns {Promise<string>} Base64 encoded audio string
   */
  async previewVoice({ text, voiceId, language, speed }) {
    throw new Error('Method not implemented.');
  }
}
