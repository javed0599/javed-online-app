import { PassportEntry, LaborResult } from './types';
import { Platform, Linking, Share } from 'react-native';

let MailComposer: any = null;
try {
  MailComposer = require('expo-mail-composer');
} catch (e) {
  console.warn('[Sharing] expo-mail-composer not available');
}

export interface ShareOptions {
  passportNumber: string;
  examDate: string;
  testCenter: string;
  status: string;
  lastChecked: string;
}

class SharingService {
  private static instance: SharingService;

  private constructor() {}

  static getInstance(): SharingService {
    if (!SharingService.instance) {
      SharingService.instance = new SharingService();
    }
    return SharingService.instance;
  }

  /**
   * Format result for sharing
   */
  private formatResultMessage(options: ShareOptions): string {
    return `Labor Result Status\n\n` +
      `📋 Passport: ${options.passportNumber}\n` +
      `📅 Exam Date: ${options.examDate}\n` +
      `🏢 Test Center: ${options.testCenter}\n` +
      `✅ Status: ${options.status}\n` +
      `🕐 Last Checked: ${options.lastChecked}\n\n` +
      `Checked via JAVED ONLINE`;
  }

  /**
   * Share via WhatsApp
   */
  async shareViaWhatsApp(options: ShareOptions): Promise<boolean> {
    try {
      const message = this.formatResultMessage(options);
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

      if (Platform.OS === 'web') {
        window.open(whatsappUrl, '_blank');
        return true;
      }

      // For native platforms, use Linking
      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Sharing] WhatsApp share failed:', error);
      return false;
    }
  }

  /**
   * Share via Email
   */
  async shareViaEmail(options: ShareOptions, recipientEmail?: string): Promise<boolean> {
    try {
      if (!MailComposer) {
        console.warn('[Sharing] Mail composer not available');
        return false;
      }

      const message = this.formatResultMessage(options);
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('[Sharing] Mail composer not available');
        return false;
      }

      await MailComposer.composeAsync({
        recipients: recipientEmail ? [recipientEmail] : [],
        subject: `Labor Result - ${options.passportNumber}`,
        body: message,
      });

      return true;
    } catch (error) {
      console.error('[Sharing] Email share failed:', error);
      return false;
    }
  }

  /**
   * Share via SMS
   */
  async shareViaSMS(options: ShareOptions, phoneNumber?: string): Promise<boolean> {
    try {
      const message = this.formatResultMessage(options);
      const smsUrl = `sms:${phoneNumber || ''}?body=${encodeURIComponent(message)}`;

      if (Platform.OS === 'web') {
        return false;
      }

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Sharing] SMS share failed:', error);
      return false;
    }
  }

  /**
   * Share using native share sheet
   */
  async shareNative(options: ShareOptions): Promise<boolean> {
    try {
      const message = this.formatResultMessage(options);

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          return true;
        }
        return false;
      }

      const result = await Share.share({
        message,
        title: `Labor Result - ${options.passportNumber}`,
      });

      return result.action !== Share.dismissedAction;
    } catch (error) {
      console.error('[Sharing] Native share failed:', error);
      return false;
    }
  }

  /**
   * Create shareable text
   */
  createShareableText(entry: PassportEntry, result: LaborResult): string {
    return this.formatResultMessage({
      passportNumber: entry.passport_number,
      examDate: result.exam_date,
      testCenter: result.test_center_name,
      status: result.exam_result.toUpperCase(),
      lastChecked: entry.last_checked_at
        ? new Date(entry.last_checked_at).toLocaleString()
        : 'Never',
    });
  }
}

export const sharingService = SharingService.getInstance();
