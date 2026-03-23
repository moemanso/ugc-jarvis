// HeyGen video generation service
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

export class VideoService {
  constructor() {
    this.apiKey = config.heyGen.apiKey;
    this.baseUrl = 'https://api.heygen.com/v2';
    
    // Avatar IDs (these are example IDs - real ones would come from HeyGen)
    this.avatarMap = {
      'Female in 20s (UGC)': 'default-female-avatar',
      'Male in 30s (Pro)': 'default-male-avatar',
      'Influencer Vibe': 'default-influencer-avatar'
    };
  }

  async createVideoFromAudio(audioPath, avatarId, script) {
    // HeyGen's actual API requires different approach
    // This is a placeholder that shows the structure
    
    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          avatar_id: avatarId,
          voice_id: script.voiceId || null,
          audio_url: audioPath,
          script: {
            type: 'script',
            script: `${script.hook} ${script.body} ${script.cta}`
          }
        }],
        aspect_ratio: '9:16',
        callback_url: null
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HeyGen error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data.video_id;
  }

  async getVideoStatus(videoId) {
    const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.status}`);
    }

    return await response.json();
  }

  async waitForVideo(videoId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoStatus(videoId);
      const state = status?.data?.video?.status;
      
      if (state === 'completed') {
        return status.data.video;
      } else if (state === 'failed') {
        throw new Error('Video generation failed');
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Video generation timed out');
  }

  // Alternative: Generate using video URL (for audio files hosted online)
  async generateWithAudioUrl(audioUrl, avatarType, script) {
    const avatarId = this.avatarMap[avatarType] || this.avatarMap['default'];
    
    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          avatar_id: avatarId,
          audio_url: audioUrl,
          script: {
            type: 'script',
            script: `${script.hook} ${script.body} ${script.cta}`
          }
        }],
        aspect_ratio: '9:16'
      })
    });

    if (!response.ok) {
      throw new Error(`HeyGen error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.video_id;
  }

  // Mock method for MVP - generates placeholder
  // In production, this would call actual HeyGen API
  async generateVideo(scripts, voiceovers, avatarType, outputDir) {
    const results = [];
    
    // For MVP, we'll create a placeholder
    // Real implementation would use HeyGen API
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const voiceover = voiceovers[i];
      
      // Placeholder response
      results.push({
        scriptIndex: i,
        videoId: `mock_video_${Date.now()}_${i}`,
        status: 'mock',
        note: 'MVP: Video generation would call HeyGen API here'
      });
    }
    
    return results;
  }
}