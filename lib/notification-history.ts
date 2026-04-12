import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationLog } from "./types";

const NOTIFICATION_LOGS_KEY = "labor_checker_notification_logs";
const MAX_LOGS = 1000; // Keep last 1000 notifications

/**
 * Add a new notification log entry
 */
export async function addNotificationLog(
  passportNumber: string,
  entryId: string,
  previousStatus: "passed" | "failed" | "pending",
  currentStatus: "passed" | "failed" | "pending",
  testCenterName: string,
  examDate: string
): Promise<NotificationLog> {
  try {
    const logs = await getNotificationLogs();

    const newLog: NotificationLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      passportNumber,
      entryId,
      previousStatus,
      currentStatus,
      testCenterName,
      examDate,
      read: false,
    };

    const updatedLogs = [newLog, ...logs].slice(0, MAX_LOGS);
    await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updatedLogs));

    return newLog;
  } catch (error) {
    console.error("Failed to add notification log:", error);
    throw error;
  }
}

/**
 * Get all notification logs
 */
export async function getNotificationLogs(): Promise<NotificationLog[]> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get notification logs:", error);
    return [];
  }
}

/**
 * Get notification logs for a specific entry
 */
export async function getNotificationLogsForEntry(
  entryId: string
): Promise<NotificationLog[]> {
  try {
    const logs = await getNotificationLogs();
    return logs.filter((log) => log.entryId === entryId);
  } catch (error) {
    console.error("Failed to get notification logs for entry:", error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(logId: string): Promise<void> {
  try {
    const logs = await getNotificationLogs();
    const updatedLogs = logs.map((log) =>
      log.id === logId ? { ...log, read: true } : log
    );
    await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const logs = await getNotificationLogs();
    const updatedLogs = logs.map((log) => ({ ...log, read: true }));
    await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

/**
 * Delete a notification log
 */
export async function deleteNotificationLog(logId: string): Promise<void> {
  try {
    const logs = await getNotificationLogs();
    const updatedLogs = logs.filter((log) => log.id !== logId);
    await AsyncStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Failed to delete notification log:", error);
  }
}

/**
 * Clear all notification logs
 */
export async function clearAllNotificationLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_LOGS_KEY);
  } catch (error) {
    console.error("Failed to clear notification logs:", error);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const logs = await getNotificationLogs();
    return logs.filter((log) => !log.read).length;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    return 0;
  }
}

/**
 * Get notification logs for a date range
 */
export async function getNotificationLogsByDateRange(
  startDate: number,
  endDate: number
): Promise<NotificationLog[]> {
  try {
    const logs = await getNotificationLogs();
    return logs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate);
  } catch (error) {
    console.error("Failed to get notification logs by date range:", error);
    return [];
  }
}

/**
 * Search notification logs by passport number
 */
export async function searchNotificationLogsByPassport(
  passportNumber: string
): Promise<NotificationLog[]> {
  try {
    const logs = await getNotificationLogs();
    return logs.filter((log) =>
      log.passportNumber.toLowerCase().includes(passportNumber.toLowerCase())
    );
  } catch (error) {
    console.error("Failed to search notification logs:", error);
    return [];
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatistics(): Promise<{
  totalNotifications: number;
  unreadNotifications: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
}> {
  try {
    const logs = await getNotificationLogs();
    const unreadCount = logs.filter((log) => !log.read).length;

    const stats = logs.reduce(
      (acc, log) => {
        if (log.currentStatus === "passed") acc.passedCount++;
        if (log.currentStatus === "failed") acc.failedCount++;
        if (log.currentStatus === "pending") acc.pendingCount++;
        return acc;
      },
      { passedCount: 0, failedCount: 0, pendingCount: 0 }
    );

    return {
      totalNotifications: logs.length,
      unreadNotifications: unreadCount,
      ...stats,
    };
  } catch (error) {
    console.error("Failed to get notification statistics:", error);
    return {
      totalNotifications: 0,
      unreadNotifications: 0,
      passedCount: 0,
      failedCount: 0,
      pendingCount: 0,
    };
  }
}
