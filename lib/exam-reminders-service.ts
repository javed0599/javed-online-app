import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExamReminder, OCRExtractedData } from "./types";

const EXAM_REMINDERS_KEY = "exam_reminders";
const EXAM_REMINDERS_COUNTER_KEY = "exam_reminders_counter";

/**
 * Exam Reminders Service
 * Manages storage and retrieval of exam reminders extracted from test tickets
 */

export class ExamRemindersService {
  /**
   * Create a new exam reminder
   */
  static async createReminder(data: Omit<ExamReminder, "id" | "created_at" | "updated_at">): Promise<ExamReminder> {
    try {
      const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      const reminder: ExamReminder = {
        ...data,
        id,
        created_at: now,
        updated_at: now,
      };

      const reminders = await this.getAllReminders();
      reminders.push(reminder);
      await AsyncStorage.setItem(EXAM_REMINDERS_KEY, JSON.stringify(reminders));

      console.log("✅ [ExamReminders] Reminder created:", id);
      return reminder;
    } catch (error) {
      console.error("❌ [ExamReminders] Error creating reminder:", error);
      throw error;
    }
  }

  /**
   * Get all exam reminders
   */
  static async getAllReminders(): Promise<ExamReminder[]> {
    try {
      const data = await AsyncStorage.getItem(EXAM_REMINDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("❌ [ExamReminders] Error getting all reminders:", error);
      return [];
    }
  }

  /**
   * Get a specific reminder by ID
   */
  static async getReminderById(id: string): Promise<ExamReminder | null> {
    try {
      const reminders = await this.getAllReminders();
      return reminders.find((r) => r.id === id) || null;
    } catch (error) {
      console.error("❌ [ExamReminders] Error getting reminder:", error);
      return null;
    }
  }

  /**
   * Update an exam reminder
   */
  static async updateReminder(id: string, updates: Partial<ExamReminder>): Promise<ExamReminder | null> {
    try {
      const reminders = await this.getAllReminders();
      const index = reminders.findIndex((r) => r.id === id);

      if (index === -1) {
        console.warn("⚠️ [ExamReminders] Reminder not found:", id);
        return null;
      }

      reminders[index] = {
        ...reminders[index],
        ...updates,
        id, // Preserve ID
        created_at: reminders[index].created_at, // Preserve creation time
        updated_at: Date.now(),
      };

      await AsyncStorage.setItem(EXAM_REMINDERS_KEY, JSON.stringify(reminders));
      console.log("✅ [ExamReminders] Reminder updated:", id);
      return reminders[index];
    } catch (error) {
      console.error("❌ [ExamReminders] Error updating reminder:", error);
      return null;
    }
  }

  /**
   * Delete an exam reminder
   */
  static async deleteReminder(id: string): Promise<boolean> {
    try {
      const reminders = await this.getAllReminders();
      const filtered = reminders.filter((r) => r.id !== id);

      if (filtered.length === reminders.length) {
        console.warn("⚠️ [ExamReminders] Reminder not found for deletion:", id);
        return false;
      }

      await AsyncStorage.setItem(EXAM_REMINDERS_KEY, JSON.stringify(filtered));
      console.log("✅ [ExamReminders] Reminder deleted:", id);
      return true;
    } catch (error) {
      console.error("❌ [ExamReminders] Error deleting reminder:", error);
      return false;
    }
  }

  /**
   * Link a reminder to a result check entry
   */
  static async linkReminderToEntry(reminderId: string, entryId: string): Promise<ExamReminder | null> {
    return this.updateReminder(reminderId, { linked_entry_id: entryId });
  }

  /**
   * Unlink a reminder from a result check entry
   */
  static async unlinkReminderFromEntry(reminderId: string): Promise<ExamReminder | null> {
    return this.updateReminder(reminderId, { linked_entry_id: undefined });
  }

  /**
   * Get reminders linked to a specific entry
   */
  static async getRemindersByEntryId(entryId: string): Promise<ExamReminder[]> {
    try {
      const reminders = await this.getAllReminders();
      return reminders.filter((r) => r.linked_entry_id === entryId);
    } catch (error) {
      console.error("❌ [ExamReminders] Error getting reminders by entry:", error);
      return [];
    }
  }

  /**
   * Get reminders by test date (for upcoming reminders)
   */
  static async getRemindersByTestDate(date: string): Promise<ExamReminder[]> {
    try {
      const reminders = await this.getAllReminders();
      return reminders.filter((r) => r.test_date === date);
    } catch (error) {
      console.error("❌ [ExamReminders] Error getting reminders by date:", error);
      return [];
    }
  }

  /**
   * Get upcoming reminders (within next 7 days)
   */
  static async getUpcomingReminders(): Promise<ExamReminder[]> {
    try {
      const reminders = await this.getAllReminders();
      const today = new Date();
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return reminders.filter((r) => {
        const reminderDate = new Date(r.test_date);
        return reminderDate >= today && reminderDate <= sevenDaysLater;
      });
    } catch (error) {
      console.error("❌ [ExamReminders] Error getting upcoming reminders:", error);
      return [];
    }
  }

  /**
   * Search reminders by name or passport
   */
  static async searchReminders(query: string): Promise<ExamReminder[]> {
    try {
      const reminders = await this.getAllReminders();
      const lowerQuery = query.toLowerCase();

      return reminders.filter(
        (r) =>
          r.name.toLowerCase().includes(lowerQuery) ||
          r.passport_no.toLowerCase().includes(lowerQuery) ||
          r.ticket_no.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error("❌ [ExamReminders] Error searching reminders:", error);
      return [];
    }
  }

  /**
   * Clear all reminders (use with caution)
   */
  static async clearAllReminders(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EXAM_REMINDERS_KEY);
      console.log("✅ [ExamReminders] All reminders cleared");
    } catch (error) {
      console.error("❌ [ExamReminders] Error clearing reminders:", error);
    }
  }

  /**
   * Export reminders as JSON
   */
  static async exportReminders(): Promise<string> {
    try {
      const reminders = await this.getAllReminders();
      return JSON.stringify(reminders, null, 2);
    } catch (error) {
      console.error("❌ [ExamReminders] Error exporting reminders:", error);
      return "[]";
    }
  }

  /**
   * Import reminders from JSON
   */
  static async importReminders(jsonData: string): Promise<boolean> {
    try {
      const reminders = JSON.parse(jsonData) as ExamReminder[];
      await AsyncStorage.setItem(EXAM_REMINDERS_KEY, JSON.stringify(reminders));
      console.log("✅ [ExamReminders] Reminders imported:", reminders.length);
      return true;
    } catch (error) {
      console.error("❌ [ExamReminders] Error importing reminders:", error);
      return false;
    }
  }
}
