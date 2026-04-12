import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReminderNotificationEvent {
  id: string;
  reminder_id: string;
  event_type: "scheduled" | "sent" | "dismissed" | "error";
  timestamp: string;
  message: string;
  exam_status?: "pending" | "passed" | "failed";
  details?: Record<string, any>;
}

/**
 * Reminder Notification History Service
 * Tracks all notification events for exam reminders
 */

export class ReminderNotificationHistoryService {
  private static readonly STORAGE_KEY = "reminder_notification_history";

  /**
   * Add notification event to history
   */
  static async addEvent(
    reminderId: string,
    eventType: "scheduled" | "sent" | "dismissed" | "error",
    message: string,
    examStatus?: "pending" | "passed" | "failed",
    details?: Record<string, any>
  ): Promise<ReminderNotificationEvent> {
    try {
      const event: ReminderNotificationEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reminder_id: reminderId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        message,
        exam_status: examStatus,
        details,
      };

      const history = await this.getHistory();
      history.push(event);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));

      console.log(`✅ [History] Event added: ${eventType} for reminder ${reminderId}`);
      return event;
    } catch (error) {
      console.error("❌ [History] Error adding event:", error);
      throw error;
    }
  }

  /**
   * Get all notification events for a reminder
   */
  static async getReminderHistory(reminderId: string): Promise<ReminderNotificationEvent[]> {
    try {
      const history = await this.getHistory();
      return history.filter((event) => event.reminder_id === reminderId);
    } catch (error) {
      console.error("❌ [History] Error getting reminder history:", error);
      return [];
    }
  }

  /**
   * Get all notification events
   */
  static async getHistory(): Promise<ReminderNotificationEvent[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as ReminderNotificationEvent[];
    } catch (error) {
      console.error("❌ [History] Error loading history:", error);
      return [];
    }
  }

  /**
   * Get latest notification event for a reminder
   */
  static async getLatestEvent(reminderId: string): Promise<ReminderNotificationEvent | null> {
    try {
      const events = await this.getReminderHistory(reminderId);
      return events.length > 0 ? events[events.length - 1] : null;
    } catch (error) {
      console.error("❌ [History] Error getting latest event:", error);
      return null;
    }
  }

  /**
   * Get notification statistics for a reminder
   */
  static async getStatistics(reminderId: string): Promise<{
    total: number;
    sent: number;
    dismissed: number;
    errors: number;
    lastNotification: ReminderNotificationEvent | null;
  }> {
    try {
      const events = await this.getReminderHistory(reminderId);

      return {
        total: events.length,
        sent: events.filter((e) => e.event_type === "sent").length,
        dismissed: events.filter((e) => e.event_type === "dismissed").length,
        errors: events.filter((e) => e.event_type === "error").length,
        lastNotification: events.length > 0 ? events[events.length - 1] : null,
      };
    } catch (error) {
      console.error("❌ [History] Error getting statistics:", error);
      return {
        total: 0,
        sent: 0,
        dismissed: 0,
        errors: 0,
        lastNotification: null,
      };
    }
  }

  /**
   * Delete history for a reminder
   */
  static async deleteReminderHistory(reminderId: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter((event) => event.reminder_id !== reminderId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log(`✅ [History] History deleted for reminder ${reminderId}`);
    } catch (error) {
      console.error("❌ [History] Error deleting history:", error);
      throw error;
    }
  }

  /**
   * Clear all history
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log("✅ [History] All history cleared");
    } catch (error) {
      console.error("❌ [History] Error clearing history:", error);
      throw error;
    }
  }

  /**
   * Get events by type
   */
  static async getEventsByType(
    reminderId: string,
    eventType: "scheduled" | "sent" | "dismissed" | "error"
  ): Promise<ReminderNotificationEvent[]> {
    try {
      const events = await this.getReminderHistory(reminderId);
      return events.filter((e) => e.event_type === eventType);
    } catch (error) {
      console.error("❌ [History] Error getting events by type:", error);
      return [];
    }
  }

  /**
   * Get events within date range
   */
  static async getEventsByDateRange(
    reminderId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReminderNotificationEvent[]> {
    try {
      const events = await this.getReminderHistory(reminderId);
      return events.filter((e) => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= startDate && eventDate <= endDate;
      });
    } catch (error) {
      console.error("❌ [History] Error getting events by date range:", error);
      return [];
    }
  }

  /**
   * Format event for display
   */
  static formatEventForDisplay(event: ReminderNotificationEvent): {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
  } {
    const date = new Date(event.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = date.toLocaleDateString();

    const eventConfig: Record<
      string,
      { title: string; icon: string; color: string }
    > = {
      scheduled: {
        title: "Reminder Scheduled",
        icon: "schedule",
        color: "#3b82f6",
      },
      sent: {
        title: "Notification Sent",
        icon: "notifications-active",
        color: "#10b981",
      },
      dismissed: {
        title: "Notification Dismissed",
        icon: "notifications-off",
        color: "#6b7280",
      },
      error: {
        title: "Notification Error",
        icon: "error-outline",
        color: "#ef4444",
      },
    };

    const config = eventConfig[event.event_type] || eventConfig.scheduled;

    return {
      title: config.title,
      subtitle: `${dateStr} at ${timeStr}`,
      icon: config.icon,
      color: config.color,
    };
  }
}
