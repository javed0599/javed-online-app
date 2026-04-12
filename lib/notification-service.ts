import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  passportNumber: string;
  previousStatus?: string;
  newStatus: string;
  testCenter?: string;
  examDate?: string;
  timestamp: string;
}

/**
 * Send a local notification when result status changes
 */
export async function sendStatusNotification(payload: NotificationPayload) {
  try {
    const statusEmoji = {
      passed: '✅',
      failed: '❌',
      pending: '⏳',
    };

    const emoji = statusEmoji[payload.newStatus as keyof typeof statusEmoji] || '📋';
    const title = `${emoji} Result Status Update`;
    
    let body = `Passport: ${payload.passportNumber}\n`;
    
    if (payload.previousStatus && payload.previousStatus !== payload.newStatus) {
      body += `Status: ${payload.previousStatus} → ${payload.newStatus}\n`;
    } else {
      body += `Status: ${payload.newStatus}\n`;
    }
    
    if (payload.testCenter) {
      body += `Center: ${payload.testCenter}\n`;
    }
    
    if (payload.examDate) {
      body += `Date: ${payload.examDate}`;
    }

    // Send local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
        data: {
          passportNumber: payload.passportNumber,
          status: payload.newStatus,
          timestamp: payload.timestamp,
        },
      },
      trigger: null, // Send immediately
    });

    console.log('🔔 [Notification] Status notification sent:', {
      passport: payload.passportNumber,
      status: payload.newStatus,
      timestamp: payload.timestamp,
    });
  } catch (error) {
    console.error('🔔 [Notification] Failed to send notification:', error);
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions() {
  try {
    if (Platform.OS === 'web') {
      console.log('🔔 [Notification] Notifications not supported on web');
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const hasPermission = status === 'granted';

    console.log('🔔 [Notification] Permission status:', status);
    return hasPermission;
  } catch (error) {
    console.error('🔔 [Notification] Failed to request permissions:', error);
    return false;
  }
}

/**
 * Get current notification permissions status
 */
export async function getNotificationPermissions() {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('🔔 [Notification] Failed to get permissions:', error);
    return false;
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification() {
  try {
    const hasPermission = await getNotificationPermissions();
    
    if (!hasPermission) {
      console.log('🔔 [Notification] No permission to send notifications');
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Test Notification',
        body: 'This is a test notification from JAVED ONLINE',
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });

    console.log('🔔 [Notification] Test notification sent');
    return true;
  } catch (error) {
    console.error('🔔 [Notification] Failed to send test notification:', error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('🔔 [Notification] All notifications cleared');
  } catch (error) {
    console.error('🔔 [Notification] Failed to clear notifications:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listen for notifications when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 [Notification] Received in foreground:', notification);
    onNotificationReceived?.(notification);
  });

  // Listen for notification taps
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('🔔 [Notification] User tapped notification:', response);
    onNotificationTapped?.(response);
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
}

/**
 * Schedule a reminder for 24 hours before exam date
 */
export async function scheduleExamReminder(
  entryId: string,
  examDateStr: string,
  applicantName?: string,
  testCenterName?: string
) {
  try {
    // Parse exam date (format: "Apr 15, 2026" or similar)
    const examDate = new Date(examDateStr);
    
    if (isNaN(examDate.getTime())) {
      console.error('🔔 [Notification] Invalid exam date:', examDateStr);
      return null;
    }

    // Schedule reminder for 24 hours before exam
    const reminderDate = new Date(examDate.getTime() - 24 * 60 * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderDate < new Date()) {
      console.warn('🔔 [Notification] Reminder time is in the past');
      return null;
    }

    // Schedule the notification
    const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'পরীক্ষার রিমাইন্ডার!',
        body: `আপনার পরীক্ষা আগামীকাল। ${applicantName ? `${applicantName}, ` : ''}প্রয়োজনীয় কাগজপত্র সাথে নিন।${testCenterName ? ` (${testCenterName})` : ''}`,
        sound: 'default',
        badge: 1,
        data: {
          entryId,
          type: 'exam_reminder',
        },
      },
      trigger: reminderDate as any,
    });

    // Store reminder info in AsyncStorage
    const reminders = await AsyncStorage.getItem('exam_reminders');
    const remindersData = reminders ? JSON.parse(reminders) : {};
    remindersData[entryId] = {
      notificationId: scheduledNotificationId,
      examDate: examDateStr,
      scheduledTime: reminderDate.toISOString(),
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('exam_reminders', JSON.stringify(remindersData));

    console.log('🔔 [Notification] Exam reminder scheduled:', scheduledNotificationId);
    return scheduledNotificationId;
  } catch (error) {
    console.error('🔔 [Notification] Failed to schedule reminder:', error);
    return null;
  }
}

/**
 * Cancel a scheduled reminder
 */
export async function cancelExamReminder(entryId: string) {
  try {
    const reminders = await AsyncStorage.getItem('exam_reminders');
    if (!reminders) return;

    const remindersData = JSON.parse(reminders);
    const reminderInfo = remindersData[entryId];

    if (reminderInfo?.notificationId) {
      await Notifications.dismissNotificationAsync(
        reminderInfo.notificationId
      );
      delete remindersData[entryId];
      await AsyncStorage.setItem('exam_reminders', JSON.stringify(remindersData));
      console.log('🔔 [Notification] Exam reminder cancelled:', entryId);
    }
  } catch (error) {
    console.error('🔔 [Notification] Failed to cancel reminder:', error);
  }
}

/**
 * Check if a reminder is set for an entry
 */
export async function hasExamReminder(entryId: string): Promise<boolean> {
  try {
    const reminders = await AsyncStorage.getItem('exam_reminders');
    if (!reminders) return false;

    const remindersData = JSON.parse(reminders);
    return !!remindersData[entryId];
  } catch (error) {
    console.error('🔔 [Notification] Failed to check reminder:', error);
    return false;
  }
}

/**
 * Get reminder info for an entry
 */
export async function getExamReminder(entryId: string) {
  try {
    const reminders = await AsyncStorage.getItem('exam_reminders');
    if (!reminders) return null;

    const remindersData = JSON.parse(reminders);
    return remindersData[entryId] || null;
  } catch (error) {
    console.error('🔔 [Notification] Failed to get reminder:', error);
    return null;
  }
}

/**
 * Get all scheduled reminders
 */
export async function getAllExamReminders() {
  try {
    const reminders = await AsyncStorage.getItem('exam_reminders');
    return reminders ? JSON.parse(reminders) : {};
  } catch (error) {
    console.error('🔔 [Notification] Failed to get all reminders:', error);
    return {};
  }
}
