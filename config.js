import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || ''
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: 'anthropic/claude-3-haiku'
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    defaultVoiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel - versatile female voice
  },
  heyGen: {
    apiKey: process.env.HEYGEN_API_KEY || ''
  },
  storage: {
    dir: process.env.STORAGE_DIR || './storage'
  }
};

export const AD_TYPES = [
  ['Testimonial', 'Problem/Solution', 'TikTok Viral', 'Storytelling']
];

export const MODEL_TYPES = [
  ['Female in 20s (UGC)', 'Male in 30s (Pro)', 'Influencer Vibe']
];

export const TONE_OPTIONS = [
  ['Casual', 'Salesy', 'Funny', 'Emotional']
];

export const PLATFORM_OPTIONS = [
  ['TikTok', 'Instagram Reels', 'YouTube Shorts']
];