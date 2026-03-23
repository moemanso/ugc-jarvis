import express from 'express';
import { Bot, webhookCallback } from 'grammy';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '8681592362:AAG9NIjDai-gJ883iDADYaCCmypv3tF7JG8');

bot.command('start', async (ctx) => {
  await ctx.reply('👋 Welcome! /create to start');
});

bot.command('create', async (ctx) => {
  await ctx.reply('📦 Send product link or image');
});

const app = express();
app.use(express.json());
app.use('/', webhookCallback(bot, 'express'));

export default app;