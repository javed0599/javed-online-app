import { ExamRemindersService } from "./exam-reminders-service";
import { ExamReminder, PassportEntry } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "labor_checker_entries";

/**
 * Reminder Entry Linking Service
 * Manages linking between exam reminders and result check entries
 */

export class ReminderEntryLinkingService {
  /**
   * Get entry by ID from storage
   */
  private static async getEntryById(id: string): Promise<PassportEntry | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const entries = JSON.parse(data) as PassportEntry[];
      return entries.find((e) => e.id === id) || null;
    } catch (error) {
      console.error("❌ [Linking] Error getting entry:", error);
      return null;
    }
  }

  /**
   * Get all entries from storage
   */
  private static async getAllEntries(): Promise<PassportEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as PassportEntry[];
    } catch (error) {
      console.error("❌ [Linking] Error getting entries:", error);
      return [];
    }
  }

  /**
   * Link a reminder to a result check entry
   * Creates a connection between exam reminder and labor result entry
   */
  static async linkReminderToEntry(reminderId: string, entryId: string): Promise<boolean> {
    try {
      // Verify reminder exists
      const reminder = await ExamRemindersService.getReminderById(reminderId);
      if (!reminder) {
        console.warn("⚠️ [Linking] Reminder not found:", reminderId);
        return false;
      }

      // Verify entry exists
      const entry = await this.getEntryById(entryId);
      if (!entry) {
        console.warn("⚠️ [Linking] Entry not found:", entryId);
        return false;
      }

      // Link reminder to entry
      await ExamRemindersService.linkReminderToEntry(reminderId, entryId);
      console.log("✅ [Linking] Reminder linked to entry:", reminderId, "->", entryId);
      return true;
    } catch (error) {
      console.error("❌ [Linking] Error linking reminder to entry:", error);
      return false;
    }
  }

  /**
   * Unlink a reminder from a result check entry
   */
  static async unlinkReminderFromEntry(reminderId: string): Promise<boolean> {
    try {
      await ExamRemindersService.unlinkReminderFromEntry(reminderId);
      console.log("✅ [Linking] Reminder unlinked from entry:", reminderId);
      return true;
    } catch (error) {
      console.error("❌ [Linking] Error unlinking reminder:", error);
      return false;
    }
  }

  /**
   * Get all reminders linked to a specific entry
   */
  static async getRemindersForEntry(entryId: string): Promise<ExamReminder[]> {
    try {
      const reminders = await ExamRemindersService.getRemindersByEntryId(entryId);
      console.log("✅ [Linking] Found reminders for entry:", entryId, reminders.length);
      return reminders;
    } catch (error) {
      console.error("❌ [Linking] Error getting reminders for entry:", error);
      return [];
    }
  }

  /**
   * Auto-link reminders based on matching criteria
   * Matches reminders to entries by passport number and occupation
   */
  static async autoLinkReminders(): Promise<{ linked: number; failed: number }> {
    try {
      const reminders = await ExamRemindersService.getAllReminders();
      const entries = await this.getAllEntries();

      let linked = 0;
      let failed = 0;

      for (const reminder of reminders) {
        // Skip if already linked
        if (reminder.linked_entry_id) continue;

        // Find matching entry
        const matchingEntry = entries.find(
          (entry: PassportEntry) =>
            entry.passport_number.toLowerCase() === reminder.passport_no.toLowerCase()
        );

        if (matchingEntry) {
          const success = await this.linkReminderToEntry(reminder.id, matchingEntry.id);
          if (success) {
            linked++;
          } else {
            failed++;
          }
        }
      }

      console.log("✅ [Linking] Auto-link complete:", linked, "linked,", failed, "failed");
      return { linked, failed };
    } catch (error) {
      console.error("❌ [Linking] Error auto-linking reminders:", error);
      return { linked: 0, failed: 0 };
    }
  }

  /**
   * Get reminder info for an entry (if linked)
   */
  static async getReminderForEntry(entryId: string): Promise<ExamReminder | null> {
    try {
      const reminders = await ExamRemindersService.getRemindersByEntryId(entryId);
      return reminders.length > 0 ? reminders[0] : null;
    } catch (error) {
      console.error("❌ [Linking] Error getting reminder for entry:", error);
      return null;
    }
  }

  /**
   * Check if entry has a linked reminder
   */
  static async hasLinkedReminder(entryId: string): Promise<boolean> {
    const reminder = await this.getReminderForEntry(entryId);
    return reminder !== null;
  }

  /**
   * Get linked reminder details for entry
   */
  static async getLinkedReminderDetails(
    entryId: string
  ): Promise<{ reminder: ExamReminder; hasNotification: boolean } | null> {
    try {
      const reminder = await this.getReminderForEntry(entryId);
      if (!reminder) return null;

      return {
        reminder,
        hasNotification: reminder.reminder_set || false,
      };
    } catch (error) {
      console.error("❌ [Linking] Error getting linked reminder details:", error);
      return null;
    }
  }

  /**
   * Validate if reminder data matches entry data
   */
  static validateReminderEntryMatch(
    reminder: ExamReminder,
    entryPassport: string,
    entryOccupation?: string
  ): boolean {
    const passportMatch = reminder.passport_no.toLowerCase() === entryPassport.toLowerCase();
    const occupationMatch = !entryOccupation || reminder.occupation.toLowerCase().includes(entryOccupation.toLowerCase());

    return passportMatch && occupationMatch;
  }
}
