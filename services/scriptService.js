// OpenRouter service for script generation
import { config } from '../config.js';

export class ScriptService {
  constructor() {
    this.apiKey = config.openRouter.apiKey;
    this.model = config.openRouter.model;
  }

  async generateScripts(productInfo, adType, tone, platform) {
    const prompt = this.buildPrompt(productInfo, adType, tone, platform);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ugc-jarvis.bot',
        'X-Title': 'UGC Jarvis'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional UGC ad script writer. Create compelling, conversion-focused scripts for short-form video ads.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseScripts(content);
  }

  buildPrompt(productInfo, adType, tone, platform) {
    const platformSpecs = {
      'TikTok': '15-60 seconds, punchy hooks, trending audio reference',
      'Instagram Reels': '15-30 seconds, visual-first, swipe-up ready',
      'YouTube Shorts': '30-60 seconds, algorithm-friendly, loop potential'
    };

    return `Create 3 UGC-style video ad scripts for a ${productInfo.productType}.

PRODUCT: ${productInfo.description}
${productInfo.link ? `LINK: ${productInfo.link}` : ''}

AD TYPE: ${adType}
TONE: ${tone}
PLATFORM: ${platform} (${platformSpecs[platform] || 'short-form'})

For each script, provide:
1. **Hook** (first 3 seconds) - grab attention immediately
2. **Body** - main content, problem/solution, benefits
3. **CTA** - clear call to action

Format as JSON:
[
  {
    "name": "Script 1 - [type]",
    "hook": "...",
    "body": "...",
    "cta": "...",
    "caption": "ready-to-post caption with emojis",
    "hashtags": ["#ugc", "#ad", "#..."]
  }
]

Make scripts authentic, conversational, and native-${platform.toLowerCase()} style.`;
  }

  parseScripts(content) {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured response
      return [{
        name: 'Script 1',
        hook: content.slice(0, 100),
        body: content.slice(100, 300),
        cta: content.slice(-100),
        caption: content.slice(0, 200),
        hashtags: ['#ugc', '#ad', '#fyp']
      }];
    } catch (e) {
      console.error('Parse error:', e);
      return [{
        name: 'Default Script',
        hook: 'Wait, you need to see this!',
        body: content,
        cta: 'Tap the link to get started!',
        caption: content.slice(0, 200),
        hashtags: ['#ugc', '#ad']
      }];
    }
  }

  analyzeProduct(mediaType, fileInfo, link) {
    // This would analyze the image/video to understand the product
    // For MVP, we'll use the link or ask user to describe
    return {
      productType: mediaType,
      description: link || fileInfo?.file_name || 'Product video',
      link: link
    };
  }
}