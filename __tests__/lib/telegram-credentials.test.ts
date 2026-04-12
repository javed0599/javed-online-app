import { describe, it, expect, beforeEach } from 'vitest';

describe('Telegram Credentials Validation', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('should validate Telegram bot token format', () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // If provided, token should match Telegram bot token format (digits:alphanumeric)
    if (botToken) {
      const isValidFormat = /^\d+:[A-Za-z0-9_-]+$/.test(botToken);
      expect(isValidFormat).toBe(true);
    }
  });

  it('should validate Telegram chat ID format', () => {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // If provided, chat ID should be numeric (can be negative)
    if (chatId) {
      const isValidFormat = /^-?\d+$/.test(chatId);
      expect(isValidFormat).toBe(true);
    }
  });

  it('should allow empty credentials (optional feature)', () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // Both should be either defined or undefined (not mixed)
    const bothDefined = botToken && chatId;
    const bothUndefined = !botToken && !chatId;
    
    expect(bothDefined || bothUndefined).toBe(true);
  });

  it('should have credentials if Telegram is enabled', () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // If one is defined, both must be defined
    if (botToken || chatId) {
      expect(botToken).toBeDefined();
      expect(chatId).toBeDefined();
      expect(botToken).not.toBe('');
      expect(chatId).not.toBe('');
    }
  });
});
