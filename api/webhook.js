import express from 'express';
import { Bot } from 'grammy';
import { v4 as uuidv4 } from 'uuid';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '8681592362:AAG9NIjDai-gJ883iDADYaCCmypv3tF7JG8');

// State management
const STEP = { NONE: 0, PRODUCT: 1, AD_TYPE: 2, MODEL: 3, TONE: 4, PLATFORM: 5 };
const states = new Map();

function getState(userId) {
  if (!states.has(userId)) {
    states.set(userId, { step: STEP.NONE, product: null, adType: null, model: null, tone: null, platform: null, projectId: null });
  }
  return states.get(userId);
}

// Keyboards
const adTypes = [['Demo', 'Testimonial', 'Review'], ['Unboxing', 'How-to', 'Comparison']];
const modelTypes = [['Model A'], ['Model B'], ['Model C']];
const toneOptions = [['Professional'], ['Casual'], ['Enthusiastic', 'Humorous']];
const platformOptions = [['TikTok'], ['Instagram Reels'], ['YouTube Shorts']];

function createAdTypeKeyboard() {
  return { reply_markup: { keyboard: adTypes, resize_keyboard: true, one_time_keyboard: true } };
}
function createModelKeyboard() {
  return { reply_markup: { keyboard: modelTypes, resize_keyboard: true, one_time_keyboard: true } };
}
function createToneKeyboard() {
  return { reply_markup: { keyboard: toneOptions, resize_keyboard: true, one_time_keyboard: true } };
}
function createPlatformKeyboard() {
  return { reply_markup: { keyboard: platformOptions, resize_keyboard: true, one_time_keyboard: true } };
}

// Commands
bot.command('start', async (ctx) => {
  await ctx.reply('👋 *Welcome to UGC Jarvis!*\n\nCreate AI-powered UGC video ads.\n\n/cancel - Cancel creation', { parse_mode: 'Markdown' });
});

bot.command('create', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = getState(userId);
  state.step = STEP.PRODUCT;
  state.projectId = uuidv4();
  
  await ctx.reply('🎬 *Step 1: Send your product*\n\nSend me:\n• A link (Amazon, Shopify, etc.)\n• Or an image\n• Or a video', { parse_mode: 'Markdown' });
});

bot.command('cancel', async (ctx) => {
  const userId = String(ctx.from.id);
  states.delete(userId);
  await ctx.reply('❌ Cancelled. /create to start fresh.');
});

// Message handlers
bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = getState(userId);
  const text = ctx.message.text;
  
  if (text.startsWith('/')) return;
  
  // Step 1: Product
  if (state.step === STEP.PRODUCT) {
    if (text.match(/^https?:\/\//)) {
      state.product = { type: 'link', link: text };
    } else {
      state.product = { type: 'text', description: text };
    }
    state.step = STEP.AD_TYPE;
    await ctx.reply('✅ Got it! Now choose ad type:', createAdTypeKeyboard());
    return;
  }
  
  // Step 2: Ad Type
  if (state.step === STEP.AD_TYPE) {
    state.adType = text;
    state.step = STEP.MODEL;
    await ctx.reply('✅ Great! Now choose model:', createModelKeyboard());
    return;
  }
  
  // Step 3: Model
  if (state.step === STEP.MODEL) {
    state.model = text;
    state.step = STEP.TONE;
    await ctx.reply('👍 Perfect! Now choose tone:', createToneKeyboard());
    return;
  }
  
  // Step 4: Tone
  if (state.step === STEP.TONE) {
    state.tone = text;
    state.step = STEP.PLATFORM;
    await ctx.reply('🎯 Last step! Choose platform:', createPlatformKeyboard());
    return;
  }
  
  // Step 5: Platform
  if (state.step === STEP.PLATFORM) {
    state.platform = text;
    await ctx.reply('🎉 All set! Generating your UGC ad...\n\n(This is a demo - full AI generation coming soon!)');
    states.delete(userId);
    return;
  }
  
  await ctx.reply('Send /create to start a new ad.');
});

bot.on(':photo', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = getState(userId);
  if (state.step === STEP.PRODUCT) {
    state.product = { type: 'image', fileId: ctx.message.photo[0].file_id };
    state.step = STEP.AD_TYPE;
    await ctx.reply('✅ Got your image! Now choose ad type:', createAdTypeKeyboard());
  }
});

bot.on(':video', async (ctx) => {
  const userId = String(ctx.from.id);
  const state = getState(userId);
  if (state.step === STEP.PRODUCT) {
    state.product = { type: 'video', fileId: ctx.message.video.file_id };
    state.step = STEP.AD_TYPE;
    await ctx.reply('✅ Got your video! Now choose ad type:', createAdTypeKeyboard());
  }
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot is running!'));
app.post('/', webhookCallback(bot, 'express'));

function webhookCallback(bot, framework) {
  return async (req, res) => {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).send('Error');
    }
  };
}

export default app;