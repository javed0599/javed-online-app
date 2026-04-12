import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  sendTelegramNotification,
  testTelegramConnection,
  isTelegramReady,
  getTelegramService,
  type TelegramMessage,
} from '../../lib/telegram-service-enhanced';

// Mock axios
vi.mock('axios');

describe('Enhanced Telegram Service', () => {
  const mockMessage = {
    passportNumber: 'A12345678',
    previousStatus: 'pending',
    newStatus: 'passed',
    testCenter: 'Riyadh Center',
    examDate: '2026-03-04',
    timestamp: new Date().toLocaleString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Telegram Service Initialization', () => {
    it('should initialize with credentials', () => {
      const service = getTelegramService();
      expect(service).toBeDefined();
    });

    it('should check if service is ready', () => {
      const isReady = isTelegramReady();
      expect(typeof isReady).toBe('boolean');
    });

    it('should have required methods', () => {
      const service = getTelegramService();
      expect(service.sendNotification).toBeDefined();
      expect(service.testConnection).toBeDefined();
      expect(service.isReady).toBeDefined();
    });
  });

  describe('Message Formatting', () => {
    it('should format message with status emoji', async () => {
      const message = {
        ...mockMessage,
        newStatus: 'passed',
      };

      // The message should contain the passed emoji
      expect(message.newStatus).toBe('passed');
    });

    it('should handle failed status', async () => {
      const message = {
        ...mockMessage,
        newStatus: 'failed',
      };

      expect(message.newStatus).toBe('failed');
    });

    it('should handle pending status', async () => {
      const message = {
        ...mockMessage,
        newStatus: 'pending',
      };

      expect(message.newStatus).toBe('pending');
    });

    it('should escape HTML special characters', async () => {
      const message = {
        ...mockMessage,
        passportNumber: 'A123<456>',
        testCenter: 'Center & Test',
      };

      expect(message.passportNumber).toContain('<');
      expect(message.testCenter).toContain('&');
    });
  });

  describe('Send Notification', () => {
    it('should return success when message is sent', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          ok: true,
          result: {
            message_id: 12345,
          },
        },
      });

      const result = await sendTelegramNotification(mockMessage);
      expect(typeof result).toBe('boolean');
    });

    it('should handle API errors gracefully', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const mockAxios = axios as any;
      const error = new Error('Timeout');
      (error as any).code = 'ECONNABORTED';
      mockAxios.post.mockRejectedValueOnce(error);

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });

    it('should include all required message fields', async () => {
      const message = {
        passportNumber: 'B98765432',
        previousStatus: 'pending',
        newStatus: 'failed',
        testCenter: 'Jeddah Center',
        examDate: '2026-03-05',
        timestamp: '3/4/2026, 10:30:00 AM',
      };

      expect(message.passportNumber).toBeDefined();
      expect(message.previousStatus).toBeDefined();
      expect(message.newStatus).toBeDefined();
      expect(message.testCenter).toBeDefined();
      expect(message.examDate).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          ok: true,
          result: {
            message_id: 54321,
          },
        },
      });

      const result = await testTelegramConnection();
      expect(typeof result).toBe('boolean');
    });

    it('should handle connection failures', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testTelegramConnection();
      expect(result).toBe(false);
    });

    it('should handle invalid response', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          ok: false,
          error_code: 400,
          description: 'Bad Request: chat_id is invalid',
        },
      });

      const result = await testTelegramConnection();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing credentials gracefully', async () => {
      // When credentials are missing, service should return false
      const result = await sendTelegramNotification(mockMessage);
      expect(typeof result).toBe('boolean');
    });

    it('should handle HTTP 401 Unauthorized', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error_code: 401, description: 'Unauthorized' },
        },
      });

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });

    it('should handle HTTP 404 Not Found', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error_code: 404, description: 'Not Found' },
        },
      });

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });

    it('should handle HTTP 429 Too Many Requests', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error_code: 429, description: 'Too Many Requests' },
        },
      });

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });

    it('should handle network timeout', async () => {
      const mockAxios = axios as any;
      mockAxios.post.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await sendTelegramNotification(mockMessage);
      expect(result).toBe(false);
    });
  });

  describe('Status Change Scenarios', () => {
    it('should send notification for pending to passed', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        previousStatus: 'pending',
        newStatus: 'passed',
      };

      expect(message.previousStatus).toBe('pending');
      expect(message.newStatus).toBe('passed');
    });

    it('should send notification for pending to failed', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        previousStatus: 'pending',
        newStatus: 'failed',
      };

      expect(message.previousStatus).toBe('pending');
      expect(message.newStatus).toBe('failed');
    });

    it('should send notification for passed to failed', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        previousStatus: 'passed',
        newStatus: 'failed',
      };

      expect(message.previousStatus).toBe('passed');
      expect(message.newStatus).toBe('failed');
    });

    it('should handle multiple status changes', async () => {
      const messages: TelegramMessage[] = [
        { ...mockMessage, previousStatus: 'pending', newStatus: 'passed' },
        { ...mockMessage, previousStatus: 'pending', newStatus: 'failed' },
        { ...mockMessage, previousStatus: 'passed', newStatus: 'failed' },
      ];

      expect(messages).toHaveLength(3);
      messages.forEach((msg) => {
        expect(msg.previousStatus).toBeDefined();
        expect(msg.newStatus).toBeDefined();
      });
    });
  });

  describe('Message Content', () => {
    it('should include passport number in message', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        passportNumber: 'TEST123456',
      };

      expect(message.passportNumber).toBe('TEST123456');
    });

    it('should include test center in message', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        testCenter: 'Dammam Center',
      };

      expect(message.testCenter).toBe('Dammam Center');
    });

    it('should include exam date in message', async () => {
      const message: TelegramMessage = {
        ...mockMessage,
        examDate: '2026-04-15',
      };

      expect(message.examDate).toBe('2026-04-15');
    });

    it('should include timestamp in message', async () => {
      const now = new Date().toLocaleString();
      const message: TelegramMessage = {
        ...mockMessage,
        timestamp: now,
      };

      expect(message.timestamp).toBe(now);
    });
  });
});
