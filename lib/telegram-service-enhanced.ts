import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = 'https://api.telegram.org';

export interface TelegramMessage {
  passportNumber: string;
  previousStatus: string;
  newStatus: string;
  testCenter: string;
  examDate: string;
  timestamp: string;
}

export interface TelegramResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enhanced Telegram service with comprehensive logging and error handling
 */
class TelegramService {
  private botToken: string | undefined;
  private chatId: string | undefined;
  private isInitialized: boolean = false;

  constructor() {
    this.botToken = TELEGRAM_BOT_TOKEN;
    this.chatId = TELEGRAM_CHAT_ID;
    this.validateCredentials();
  }

  /**
   * Validate Telegram credentials on initialization
   */
  private validateCredentials(): void {
    console.log('🔔 [Telegram] Initializing service...');
    console.log('🔔 [Telegram] Bot Token configured:', !!this.botToken);
    console.log('🔔 [Telegram] Chat ID configured:', !!this.chatId);

    if (this.botToken && this.chatId) {
      this.isInitialized = true;
      console.log('✅ [Telegram] Service initialized successfully');
    } else {
      console.warn('⚠️  [Telegram] Service NOT initialized - missing credentials');
      if (!this.botToken) {
        console.warn('⚠️  [Telegram] Missing TELEGRAM_BOT_TOKEN environment variable');
      }
      if (!this.chatId) {
        console.warn('⚠️  [Telegram] Missing TELEGRAM_CHAT_ID environment variable');
      }
    }
  }

  /**
   * Check if service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Send a status change notification to Telegram
   */
  async sendNotification(message: TelegramMessage): Promise<TelegramResponse> {
    console.log('🔔 [Telegram] Sending notification...');
    console.log('🔔 [Telegram] Passport:', message.passportNumber);
    console.log('🔔 [Telegram] Status change:', `${message.previousStatus} → ${message.newStatus}`);

    if (!this.isInitialized) {
      const error = 'Telegram service not initialized - missing credentials';
      console.error('❌ [Telegram]', error);
      return {
        success: false,
        error,
      };
    }

    try {
      const text = this.formatMessage(message);
      console.log('🔔 [Telegram] Message formatted successfully');

      const response = await axios.post(
        `${TELEGRAM_API_URL}/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: text,
          parse_mode: 'HTML',
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.ok) {
        const messageId = response.data.result.message_id;
        console.log('✅ [Telegram] Message sent successfully');
        console.log('✅ [Telegram] Message ID:', messageId);
        return {
          success: true,
          messageId: String(messageId),
        };
      } else {
        const error = 'Unexpected response from Telegram API';
        console.error('❌ [Telegram]', error);
        console.error('❌ [Telegram] Response:', response.data);
        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      const errorMessage = this.formatError(error);
      console.error('❌ [Telegram] Failed to send notification');
      console.error('❌ [Telegram] Error:', errorMessage);

      if (axios.isAxiosError(error)) {
        console.error('❌ [Telegram] HTTP Status:', error.response?.status);
        console.error('❌ [Telegram] Response Data:', error.response?.data);
        console.error('❌ [Telegram] Error Message:', error.message);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Test Telegram connection and credentials
   */
  async testConnection(): Promise<TelegramResponse> {
    console.log('🔔 [Telegram] Testing connection...');

    if (!this.isInitialized) {
      const error = 'Telegram service not initialized - missing credentials';
      console.warn('⚠️  [Telegram]', error);
      return {
        success: false,
        error,
      };
    }

    try {
      const response = await axios.post(
        `${TELEGRAM_API_URL}/bot${this.botToken}/sendMessage`,
        {
          chat_id: this.chatId,
          text: '🔧 JAVED ONLINE - Connection test successful!\n\nThis is a test message to verify the Telegram integration is working correctly.',
          parse_mode: 'HTML',
        },
        {
          timeout: 10000,
        }
      );

      if (response.status === 200 && response.data.ok) {
        console.log('✅ [Telegram] Connection test successful');
        return {
          success: true,
          messageId: String(response.data.result.message_id),
        };
      } else {
        console.error('❌ [Telegram] Connection test failed - invalid response');
        return {
          success: false,
          error: 'Invalid response from Telegram API',
        };
      }
    } catch (error) {
      const errorMessage = this.formatError(error);
      console.error('❌ [Telegram] Connection test failed');
      console.error('❌ [Telegram] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Format message for Telegram with HTML styling
   */
  private formatMessage(message: TelegramMessage): string {
    const statusEmoji = this.getStatusEmoji(message.newStatus);

    return `
<b>${statusEmoji} Labor Result Status Changed</b>

<b>Passport:</b> <code>${this.escapeHtml(message.passportNumber)}</code>
<b>Previous Status:</b> ${this.escapeHtml(message.previousStatus)}
<b>New Status:</b> <b>${this.escapeHtml(message.newStatus)}</b>
<b>Test Center:</b> ${this.escapeHtml(message.testCenter)}
<b>Exam Date:</b> ${this.escapeHtml(message.examDate)}
<b>Updated:</b> ${this.escapeHtml(message.timestamp)}

Check the JAVED ONLINE app for more details.
    `.trim();
  }

  /**
   * Get emoji for status
   */
  private getStatusEmoji(status: string): string {
    switch (status.toLowerCase()) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Format error message for logging
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error);
  }
}

// Create singleton instance
const telegramService = new TelegramService();

/**
 * Send a status change notification to Telegram
 */
export async function sendTelegramNotification(message: TelegramMessage): Promise<boolean> {
  const result = await telegramService.sendNotification(message);
  return result.success;
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<boolean> {
  const result = await telegramService.testConnection();
  return result.success;
}

/**
 * Get Telegram service instance for advanced operations
 */
export function getTelegramService() {
  return telegramService;
}

/**
 * Check if Telegram service is ready
 */
export function isTelegramReady(): boolean {
  return telegramService.isReady();
}
