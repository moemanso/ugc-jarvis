// Inline keyboard helpers
import { AD_TYPES, MODEL_TYPES, TONE_OPTIONS, PLATFORM_OPTIONS } from '../config.js';

export function createMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '/create' }, { text: '/history' }],
        [{ text: '/help' }]
      ],
      resize_keyboard: true
    }
  };
}

export function createAdTypeKeyboard() {
  return {
    reply_markup: {
      keyboard: AD_TYPES,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

export function createModelKeyboard() {
  return {
    reply_markup: {
      keyboard: MODEL_TYPES,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

export function createToneKeyboard() {
  return {
    reply_markup: {
      keyboard: TONE_OPTIONS,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

export function createPlatformKeyboard() {
  return {
    reply_markup: {
      keyboard: PLATFORM_OPTIONS,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

export function createCancelKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '/cancel' }]
      ],
      resize_keyboard: true
    }
  };
}