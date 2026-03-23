// Conversation state management
export const STEP = {
  NONE: 0,
  PRODUCT: 1,        // Waiting for product image/video/link
  AD_TYPE: 2,        // Choose ad type
  MODEL: 3,          // Choose model
  TONE: 4,           // Choose tone
  PLATFORM: 5,       // Choose platform
  PROCESSING: 6,     // Generating content
  COMPLETE: 7        // Done
};

export class ConversationState {
  constructor(userId) {
    this.userId = userId;
    this.step = STEP.NONE;
    this.product = null;      // { type, fileId, link, filePath }
    this.adType = null;
    this.model = null;
    this.tone = null;
    this.platform = null;
    this.scripts = null;
    this.voiceovers = null;
    this.videos = null;
    this.projectId = null;
  }

  reset() {
    this.step = STEP.NONE;
    this.product = null;
    this.adType = null;
    this.model = null;
    this.tone = null;
    this.platform = null;
    this.scripts = null;
    this.voiceovers = null;
    this.videos = null;
    this.projectId = null;
  }

  getSummary() {
    return `
📋 **Current Project:**
• Product: ${this.product?.type || 'N/A'} ${this.product?.link ? `(${this.product.link})` : ''}
• Ad Type: ${this.adType}
• Model: ${this.model}
• Tone: ${this.tone}
• Platform: ${this.platform}
    `.trim();
  }
}

export class StateManager {
  constructor() {
    this.states = new Map();
  }

  get(userId) {
    if (!this.states.has(userId)) {
      this.states.set(userId, new ConversationState(userId));
    }
    return this.states.get(userId);
  }

  clear(userId) {
    const state = this.states.get(userId);
    if (state) {
      state.reset();
    }
  }
}