import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTelegramNotification, testTelegramConnection, TelegramMessage } from '../telegram-service';
import axios from 'axios';

vi.mock('axios');

describe('Telegram Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendTelegramNotification', () => {
    it('should send notification with correct format', async () => {
      const mockPost = vi.mocked(axios.post);
      mockPost.mockResolvedValue({ status: 200, data: { ok: true } });
      
      // Set environment variables for this test
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      const message: TelegramMessage = {
        passportNumber: 'A12345678',
        previousStatus: 'pending',
        newStatus: 'passed',
        testCenter: 'Test Center',
        examDate: '2026-02-05',
        timestamp: '2026-02-04 10:00:00',
      };

      const result = await sendTelegramNotification(message);

      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const mockPost = vi.mocked(axios.post);
      mockPost.mockRejectedValue(new Error('Network error'));

      const message: TelegramMessage = {
        passportNumber: 'A12345678',
        previousStatus: 'pending',
        newStatus: 'failed',
        testCenter: 'Test Center',
        examDate: '2026-02-05',
        timestamp: '2026-02-04 10:00:00',
      };

      const result = await sendTelegramNotification(message);

      expect(result).toBe(false);
    });

    it('should return false if credentials not configured', async () => {
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;

      const message: TelegramMessage = {
        passportNumber: 'A12345678',
        previousStatus: 'pending',
        newStatus: 'passed',
        testCenter: 'Test Center',
        examDate: '2026-02-05',
        timestamp: '2026-02-04 10:00:00',
      };

      const result = await sendTelegramNotification(message);

      expect(result).toBe(false);

      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });
  });

  describe('testTelegramConnection', () => {
    it('should test connection successfully', async () => {
      const mockPost = vi.mocked(axios.post);
      mockPost.mockResolvedValue({ status: 200, data: { ok: true } });
      
      // Set environment variables for this test
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

      const result = await testTelegramConnection();

      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      const mockPost = vi.mocked(axios.post);
      mockPost.mockRejectedValue(new Error('Connection failed'));

      const result = await testTelegramConnection();

      expect(result).toBe(false);
    });
  });
});
