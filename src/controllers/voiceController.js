import { sarvamProvider } from '../services/ai/tts/sarvamProvider.js';

// Simple provider factory/router
const getProvider = (providerName) => {
  if (providerName === 'sarvam') return sarvamProvider;
  // if (providerName === 'elevenlabs') return elevenLabsProvider;
  throw new Error(`Voice provider '${providerName}' is not supported.`);
};

export const getVoices = async (req, res, next) => {
  try {
    const providerName = req.query.provider || 'sarvam';
    const provider = getProvider(providerName);
    
    const voices = await provider.getVoices();
    res.status(200).json({ success: true, data: voices });
  } catch (error) {
    next(error);
  }
};

export const previewVoice = async (req, res, next) => {
  try {
    const { provider: providerName = 'sarvam', voiceId, text, language, speed } = req.body;
    
    if (!voiceId || !text) {
      return res.status(400).json({ success: false, error: 'voiceId and text are required.' });
    }

    const provider = getProvider(providerName);
    const audioBase64 = await provider.previewVoice({ text, voiceId, language, speed });
    
    res.status(200).json({ success: true, data: { audioBase64 } });
  } catch (error) {
    next(error);
  }
};