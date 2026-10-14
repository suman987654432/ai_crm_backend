import WebSocket from 'ws';
import { config } from '../../../config/env.js';

export class SarvamTTSStreamer {
  constructor(language = 'hi-IN', speaker = 'shubh', onAudioChunk) {
    this.onAudioChunk = onAudioChunk;
    this.isReady = false;
    this.queue = [];
    this.firstChunkTime = null;
    this.sendTextTime = null;
    this.language = language;
    this.speaker = speaker;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket('wss://api.sarvam.ai/text-to-speech/ws', {
        headers: { 'Api-Subscription-Key': config.sarvamApiKey }
      });

      this.ws.on('open', () => {
        this.isReady = true;
        this.ws.send(JSON.stringify({
          type: 'config',
          data: {
            model: 'bulbul:v3',
            language_code: this.language,
            speaker: this.speaker,
            output_audio_codec: 'linear16',
            speech_sample_rate: '24000'
          }
        }));
        // send queued text
        while (this.queue.length > 0) {
          this.sendText(this.queue.shift());
        }
      });

      this.ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'audio' && msg.data?.audio) {
            if (!this.firstChunkTime && this.sendTextTime) {
              this.firstChunkTime = Date.now();
              const ttsLatency = this.firstChunkTime - this.sendTextTime;
              console.log(`[LATENCY] TTS First Audio Chunk (Sarvam): ${ttsLatency}ms`);
            }
            if (this.onAudioChunk) {
              this.onAudioChunk(msg.data.audio);
            }
          }
        } catch(e) {
          console.error('TTS WS Parse Error:', e);
        }
      });

      this.ws.on('error', (err) => {
        console.error('TTS WS Error:', err?.message || err);
        this.isReady = false;
      });

      this.ws.on('close', () => {
        this.isReady = false;
      });
    } catch(err) {
      console.error('TTS WS Connect Exception:', err);
    }
  }

  sendText(text) {
    if (!text.trim()) return;
    if (!this.sendTextTime) {
      this.sendTextTime = Date.now();
    }
    if (this.isReady) {
      this.ws.send(JSON.stringify({ type: 'text', data: { text } }));
    } else {
      this.queue.push(text);
    }
  }

  flush() {
    if (this.isReady) {
      this.ws.send(JSON.stringify({ type: 'flush' }));
    }
  }

  close() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}
