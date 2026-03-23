// ElevenLabs service for voiceover generation
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

export class VoiceService {
  constructor() {
    this.apiKey = config.elevenLabs.apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    // Voice mappings based on tone/model
    this.voiceMap = {
      'Female in 20s (UGC)': '21m00Tcm4TlvDq8ikWAM',    // Rachel
      'Male in 30s (Pro)': 'AZnzlk1XvdvUeBnXmlld',      // Domi
      'Influencer Vibe': 'EXAVITQu4vr4xnSDxMaL',        // Sarah
      'default': '21m00Tcm4TlvDq8ikWAM'
    };
  }

  getVoiceId(modelType) {
    return this.voiceMap[modelType] || this.voiceMap['default'];
  }

  async textToSpeech(text, modelType = 'Female in 20s (UGC)') {
    const voiceId = this.getVoiceId(modelType);
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs error: ${response.status} - ${error}`);
    }

    return await response.arrayBuffer();
  }

  async generateVoiceovers(scripts, modelType, outputDir) {
    const results = [];
    
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      // Combine hook + body for voiceover (skip CTA for timing)
      const fullText = `${script.hook} ${script.body}`;
      
      const outputPath = path.join(outputDir, `voiceover_${i + 1}.mp3`);
      
      try {
        const audioBuffer = await this.textToSpeech(fullText, modelType);
        
        // Ensure directory exists
        fs.mkdirSync(outputDir, { recursive: true });
        
        // Write file
        fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
        
        results.push({
          scriptIndex: i,
          path: outputPath,
          text: fullText
        });
        
        console.log(`✅ Voiceover ${i + 1} saved to ${outputPath}`);
      } catch (error) {
        console.error(`❌ Voiceover ${i + 1} failed:`, error.message);
        results.push({
          scriptIndex: i,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Get available voices (requires API call)
  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }
    
    const data = await response.json();
    return data.voices;
  }
}