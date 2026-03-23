// UGC Jarvis - Main Telegram Bot
import { Bot, Keyboard } from 'grammy';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { config, AD_TYPES, MODEL_TYPES, TONE_OPTIONS, PLATFORM_OPTIONS } from './config.js';
import { ScriptService } from './services/scriptService.js';
import { VoiceService } from './services/voiceService.js';
import { VideoService } from './services/videoService.js';
import { StorageService } from './services/storageService.js';
import { StateManager, STEP } from './utils/stateManager.js';
import { createAdTypeKeyboard, createModelKeyboard, createToneKeyboard, createPlatformKeyboard, createMainKeyboard, createCancelKeyboard } from './utils/keyboards.js';

dotenv.config();

// Initialize services
const scriptService = new ScriptService();
const voiceService = new VoiceService();
const videoService = new VideoService();
const storageService = new StorageService();
const stateManager = new StateManager();

// Initialize bot
const bot = new Bot(config.telegram.botToken);

// ============ COMMAND HANDLERS ============

bot.command('start', async (ctx) => {
  const keyboard = createMainKeyboard();
  await ctx.reply(`👋 *Welcome to UGC Jarvis!*

Create AI-powered UGC video ads in minutes.

How it works:
1. Send /create to start
2. Upload your product (image/video/link)
3. Choose ad type, model, tone & platform
4. Get AI-generated video ads!

Let's go!`, { parse_mode: 'Markdown', ...keyboard });
});

bot.command('help', async (ctx) => {
  await ctx.reply(`📖 *UGC Jarvis Help*

/create - Start creating a new ad
/history - View your past projects
/cancel - Cancel current creation

*Tips:*
• Upload clear product images/videos
• Be specific with your product link
• Try different tones for best results`, { parse_mode: 'Markdown' });
});

bot.command('cancel', async (ctx) => {
  const userId = String(ctx.from.id);
  stateManager.clear(userId);
  await ctx.reply('❌ Cancelled. Type /create to start fresh.', createMainKeyboard());
});

bot.command('history', async (ctx) => {
  const userId = String(ctx.from.id);
  const history = storageService.getHistory(userId);
  
  if (history.length === 0) {
    await ctx.reply('📭 No history yet. Create your first ad with /create!');
    return;
  }
  
  let message = '📊 *Your Past Projects:*\n\n';
  history.slice(0, 5).forEach((item, i) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    message += `${i + 1}. ${item.adType} - ${item.tone} (${date})\n`;
  });
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.command('create', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = stateManager.get(userId);
  state.reset();
  state.step = STEP.PRODUCT;
  state.projectId = uuidv4();
  
  await ctx.reply(`🎬 *Let's Create Your Ad!*

*Step 1:* Upload your product

Send me:
• 📷 An image (product photo)
• 🎥 A video (product demo)
• 🔗 A link (Shopify, Amazon, etc.)

Or type a brief product description.`, { 
    parse_mode: 'Markdown',
    ...createCancelKeyboard()
  });
});

// ============ MESSAGE HANDLERS ============

// Handle product upload
bot.on(':photo', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = stateManager.get(userId);
  
  if (state.step !== STEP.PRODUCT) return;
  
  const photo = ctx.message.photo;
  const fileId = photo[photo.length - 1].file_id;
  
  state.product = {
    type: 'image',
    fileId: fileId,
    description: 'Product image'
  };
  
  state.step = STEP.AD_TYPE;
  await ctx.reply('✅ Got your image! Now choose your ad type:', createAdTypeKeyboard());
});

bot.on(':video', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = stateManager.get(userId);
  
  if (state.step !== STEP.PRODUCT) return;
  
  const video = ctx.message.video;
  const fileId = video.file_id;
  
  state.product = {
    type: 'video',
    fileId: fileId,
    description: 'Product video'
  };
  
  state.step = STEP.AD_TYPE;
  await ctx.reply('✅ Got your video! Now choose your ad type:', createAdTypeKeyboard());
});

bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = stateManager.get(userId);
  const text = ctx.message.text;
  
  // Skip commands
  if (text.startsWith('/')) return;
  
  // Handle /create flow
  if (state.step === STEP.PRODUCT) {
    // Check if it's a URL
    if (text.match(/^https?:\/\//)) {
      state.product = {
        type: 'link',
        link: text,
        description: 'Product link'
      };
    } else {
      state.product = {
        type: 'text',
        description: text,
        link: text
      };
    }
    
    state.step = STEP.AD_TYPE;
    await ctx.reply('✅ Got it! Now choose your ad type:', createAdTypeKeyboard());
    return;
  }
  
  // Handle ad type selection
  if (state.step === STEP.AD_TYPE) {
    const validTypes = AD_TYPES.flat();
    if (validTypes.includes(text)) {
      state.adType = text;
      state.step = STEP.MODEL;
      await ctx.reply('✅ Great! Now choose the model:', createModelKeyboard());
    }
    return;
  }
  
  // Handle model selection
  if (state.step === STEP.MODEL) {
    const validModels = MODEL_TYPES.flat();
    if (validModels.includes(text)) {
      state.model = text;
      state.step = STEP.TONE;
      await ctx.reply('👍 Perfect! Now choose the tone:', createToneKeyboard());
    }
    return;
  }
  
  // Handle tone selection
  if (state.step === STEP.TONE) {
    const validTones = TONE_OPTIONS.flat();
    if (validTones.includes(text)) {
      state.tone = text;
      state.step = STEP.PLATFORM;
      await ctx.reply('🎯 Got it! Finally, choose the platform:', createPlatformKeyboard());
    }
    return;
  }
  
  // Handle platform selection
  if (state.step === STEP.PLATFORM) {
    const validPlatforms = PLATFORM_OPTIONS.flat();
    if (validPlatforms.includes(text)) {
      state.platform = text;
      state.step = STEP.PROCESSING;
      
      // Start generation!
      await startGeneration(ctx, state);
    }
    return;
  }
});

// ============ GENERATION FLOW ============

async function startGeneration(ctx, state) {
  const userId = String(ctx.from.id);
  const projectDir = storageService.getProjectDir(userId, state.projectId);
  
  try {
    // Step 1: Generate scripts
    await ctx.reply('📝 *Generating scripts...*', { parse_mode: 'Markdown' });
    
    const productInfo = {
      productType: state.product.type,
      description: state.product.description,
      link: state.product.link
    };
    
    const scripts = await scriptService.generateScripts(
      productInfo,
      state.adType,
      state.tone,
      state.platform
    );
    
    state.scripts = scripts;
    await ctx.reply(`✅ *Scripts generated!*

Created ${scripts.length} script variations.`, { parse_mode: 'Markdown' });
    
    // Step 2: Generate voiceovers
    await ctx.reply('🎤 *Creating voiceovers...*', { parse_mode: 'Markdown' });
    
    const voiceovers = await voiceService.generateVoiceovers(
      scripts,
      state.model,
      projectDir
    );
    
    state.voiceovers = voiceovers;
    await ctx.reply(`✅ *Voiceovers ready!*

${voiceovers.filter(v => !v.error).length} voiceovers created.`, { parse_mode: 'Markdown' });
    
    // Step 3: Generate videos
    await ctx.reply('🎬 *Rendering videos...* (this may take a minute)', { parse_mode: 'Markdown' });
    
    const videos = await videoService.generateVideo(
      scripts,
      voiceovers,
      state.model,
      projectDir
    );
    
    state.videos = videos;
    
    // Save to history
    storageService.saveHistory(userId, {
      adType: state.adType,
      model: state.model,
      tone: state.tone,
      platform: state.platform,
      scripts: scripts.length,
      videos: videos.length
    });
    
    // Final response
    await sendFinalResults(ctx, state, scripts, projectDir);
    
    // Reset state
    state.step = STEP.COMPLETE;
    
  } catch (error) {
    console.error('Generation error:', error);
    await ctx.reply(`❌ Error: ${error.message}`, createMainKeyboard());
    state.step = STEP.NONE;
  }
}

async function sendFinalResults(ctx, state, scripts, projectDir) {
  const platform = state.platform.toLowerCase();
  
  let message = `🎉 *Your UGC Ads Are Ready!*\n\n`;
  message += `📺 *Platform:* ${state.platform}\n`;
  message += `🎭 *Model:* ${state.model}\n`;
  message += `🎨 *Tone:* ${state.tone}\n\n`;
  
  // Show scripts with captions/hashtags
  scripts.forEach((script, i) => {
    message += `\n*--- Script ${i + 1} ---*\n\n`;
    message += `📣 *Hook:* ${script.hook}\n\n`;
    message += `📝 *Body:* ${script.body}\n\n`;
    message += `👉 *CTA:* ${script.cta}\n\n`;
    message += `💬 *Caption:* ${script.caption}\n`;
    message += `${script.hashtags.join(' ')}\n`;
  });
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
  
  // Send voiceovers
  if (state.voiceovers) {
    await ctx.reply('🎤 *Voiceovers:*', { parse_mode: 'Markdown' });
    
    for (const vo of state.voiceovers) {
      if (vo.path && fs.existsSync(vo.path)) {
        await ctx.replyWithVoice(vo.path);
      }
    }
  }
  
  // Note about videos (MVP limitation)
  await ctx.reply(`📹 *Videos:* 

⚠️ *Note:* Video rendering via HeyGen API requires additional setup.
In production, the videos would be generated and sent here.

To enable video generation, configure HeyGen API properly or integrate an alternative like Runway/Pika.`, { parse_mode: 'Markdown' });
  
  await ctx.reply('✨ Done! Type /create to make another ad.', createMainKeyboard());
}

// ============ ERROR HANDLING ============

bot.catch((err) => {
  console.error('Bot error:', err);
});

// ============ START BOT ============

import express from 'express';
import { webhookCallback } from 'grammy';

console.log('🤖 UGC Jarvis starting...');

// Webhook mode for production (Vercel compatible)
const app = express();
app.use(express.json());
app.use('/webhook', webhookCallback(bot, 'express'));

// Vercel serverless export
export default app;