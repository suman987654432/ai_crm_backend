import { VoiceProvider } from '../../voice/voiceProvider.js';
import { config } from '../../../config/env.js';

const SARVAM_VOICES = [
  // Females
  { voiceId: 'ritu', voiceName: 'Ritu', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'priya', voiceName: 'Priya', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'neha', voiceName: 'Neha', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'pooja', voiceName: 'Pooja', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'simran', voiceName: 'Simran', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'kavya', voiceName: 'Kavya', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'ishita', voiceName: 'Ishita', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'shreya', voiceName: 'Shreya', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'roopa', voiceName: 'Roopa', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'tanya', voiceName: 'Tanya', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'shruti', voiceName: 'Shruti', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'suhani', voiceName: 'Suhani', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'kavitha', voiceName: 'Kavitha', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'rupali', voiceName: 'Rupali', gender: 'Female', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },

  // Males
  { voiceId: 'aditya', voiceName: 'Aditya', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'ashutosh', voiceName: 'Ashutosh', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'rahul', voiceName: 'Rahul', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'rohan', voiceName: 'Rohan', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'amit', voiceName: 'Amit', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'dev', voiceName: 'Dev', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'ratan', voiceName: 'Ratan', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'varun', voiceName: 'Varun', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'manan', voiceName: 'Manan', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'sumit', voiceName: 'Sumit', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'kabir', voiceName: 'Kabir', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'aayan', voiceName: 'Aayan', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'shubh', voiceName: 'Shubh', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'advait', voiceName: 'Advait', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'anand', voiceName: 'Anand', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'tarun', voiceName: 'Tarun', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'sunny', voiceName: 'Sunny', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'mani', voiceName: 'Mani', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'gokul', voiceName: 'Gokul', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'vijay', voiceName: 'Vijay', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'mohit', voiceName: 'Mohit', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'rehan', voiceName: 'Rehan', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
  { voiceId: 'soham', voiceName: 'Soham', gender: 'Male', supportedLanguages: ['hi-IN', 'en-IN'], provider: 'sarvam' },
];

export class SarvamProvider extends VoiceProvider {
  async getVoices() {
    return SARVAM_VOICES;
  }

  async previewVoice({ text, voiceId, language, speed = 1.0 }) {
    if (!config.sarvamApiKey) {
      throw new Error('Sarvam API key is not configured.');
    }

    const payload = {
      inputs: [text],
      target_language_code: language || 'hi-IN',
      speaker: voiceId,
      pitch: 0,
      pace: parseFloat(speed),
      loudness: 1.5,
      speech_sample_rate: 8000,
      enable_preprocessing: true,
      model: 'bulbul:v3'
    };

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': config.sarvamApiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Sarvam TTS Error:', errText);
      throw new Error(`Failed to generate audio from Sarvam: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Sarvam returns { audios: ["<base64_string>"] }
    if (data.audios && data.audios.length > 0) {
      return data.audios[0];
    }
    
    throw new Error('Invalid response format from Sarvam API');
  }
}

export const sarvamProvider = new SarvamProvider();
