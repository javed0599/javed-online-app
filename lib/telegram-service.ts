import axios from 'axios';

const TELEGRAM_API_URL = 'https://api.telegram.org';

function getTelegramBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getTelegramChatId(): string | undefined {
  return process.env.TELEGRAM_CHAT_ID;
}

export interface TelegramMessage {
  passportNumber: string;
  previousStatus: string;
  newStatus: string;
  testCenter: string;
  examDate: string;
  timestamp: string;
}

/**
 * Send a status change notification to Telegram
 */
export async function sendTelegramNotification(message: TelegramMessage): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = getTelegramBotToken();
  const TELEGRAM_CHAT_ID = getTelegramChatId();
  
  console.log('🔔 [Telegram] Attempting to send notification');
  console.log('🔔 [Telegram] Bot Token exists:', !!TELEGRAM_BOT_TOKEN);
  console.log('🔔 [Telegram] Chat ID exists:', !!TELEGRAM_CHAT_ID);
  console.log('🔔 [Telegram] Message:', message);

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  [Telegram] Credentials not configured');
    console.warn('⚠️  [Telegram] TELEGRAM_BOT_TOKEN:', TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET');
    console.warn('⚠️  [Telegram] TELEGRAM_CHAT_ID:', TELEGRAM_CHAT_ID ? 'SET' : 'NOT SET');
    return false;
  }

  try {
    const text = formatTelegramMessage(message);
    console.log('🔔 [Telegram] Formatted message:', text);
    
    const response = await axios.post(
      `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      },
      {
        timeout: 10000,
      }
    );

    console.log('✅ [Telegram] Response status:', response.status);
    console.log('✅ [Telegram] Response data:', response.data);
    return response.status === 200;
  } catch (error) {
    console.error('❌ [Telegram] Failed to send notification:', error);
    if (axios.isAxiosError(error)) {
      console.error('❌ [Telegram] Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return false;
  }
}

/**
 * Format message for Telegram with HTML styling
 */
function formatTelegramMessage(message: TelegramMessage): string {
  const statusEmoji = getStatusEmoji(message.newStatus);
  
  return `
<b>${statusEmoji} Labor Result Status Changed</b>

<b>Passport:</b> <code>${message.passportNumber}</code>
<b>Previous Status:</b> ${message.previousStatus}
<b>New Status:</b> <b>${message.newStatus}</b>
<b>Test Center:</b> ${message.testCenter}
<b>Exam Date:</b> ${message.examDate}
<b>Updated:</b> ${message.timestamp}

Check the app for more details.
  `.trim();
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status: string): string {
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
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = getTelegramBotToken();
  const TELEGRAM_CHAT_ID = getTelegramChatId();
  
  console.log('🔔 [Telegram] Testing connection...');
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  [Telegram] Credentials not configured');
    return false;
  }

  try {
    const response = await axios.post(
      `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: '🔧 JAVED ONLINE - Connection test successful!',
        parse_mode: 'HTML',
      },
      {
        timeout: 10000,
      }
    );

    console.log('✅ [Telegram] Test successful:', response.status === 200);
    return response.status === 200;
  } catch (error) {
    console.error('❌ [Telegram] Connection test failed:', error);
    return false;
  }
}
