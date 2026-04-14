import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExamReminder, PassportEntry } from "./types";

/**
 * Entry Linking Service
 * Handles linking exam reminders to passport entries for automatic result checking
 */
export class EntryLinkingService {
  private static readonly LINKED_ENTRIES_KEY = "exam_reminder_linked_entries";

  /**
   * Link an exam reminder to a passport entry
   * This enables automatic result checking on the test date
   */
  static async linkReminderToEntry(
    reminderId: string,
    entryId: string
  ): Promise<void> {
    try {
      const links = await this.getLinkedEntries();
      links[reminderId] = entryId;
      await AsyncStorage.setItem(
        this.LINKED_ENTRIES_KEY,
        JSON.stringify(links)
      );
    } catch (error) {
      console.error("Error linking reminder to entry:", error);
      throw new Error("Failed to link reminder to entry");
    }
  }

  /**
   * Unlink an exam reminder from a passport entry
   */
  static async unlinkReminderFromEntry(reminderId: string): Promise<void> {
    try {
      const links = await this.getLinkedEntries();
      delete links[reminderId];
      await AsyncStorage.setItem(
        this.LINKED_ENTRIES_KEY,
        JSON.stringify(links)
      );
    } catch (error) {
      console.error("Error unlinking reminder from entry:", error);
      throw new Error("Failed to unlink reminder from entry");
    }
  }

  /**
   * Get the linked entry ID for a reminder
   */
  static async getLinkedEntry(reminderId: string): Promise<string | null> {
    try {
      const links = await this.getLinkedEntries();
      return links[reminderId] || null;
    } catch (error) {
      console.error("Error getting linked entry:", error);
      return null;
    }
  }

  /**
   * Get all linked entries
   */
  static async getLinkedEntries(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(this.LINKED_ENTRIES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error getting linked entries:", error);
      return {};
    }
  }

  /**
   * Check if a reminder is linked to an entry
   */
  static async isLinked(reminderId: string): Promise<boolean> {
    const linkedEntry = await this.getLinkedEntry(reminderId);
    return linkedEntry !== null;
  }

  /**
   * Get all reminders linked to a specific entry
   */
  static async getRemindersForEntry(entryId: string): Promise<string[]> {
    try {
      const links = await this.getLinkedEntries();
      return Object.entries(links)
        .filter(([_, linkedId]) => linkedId === entryId)
        .map(([reminderId]) => reminderId);
    } catch (error) {
      console.error("Error getting reminders for entry:", error);
      return [];
    }
  }

  /**
   * Create a reminder from a passport entry
   * Useful for users who want to set reminders for entries they're already tracking
   */
  static async createReminderFromEntry(
    entry: PassportEntry,
    testDate: string,
    testTime: string,
    testCenter: string
  ): Promise<ExamReminder> {
    const reminder: ExamReminder = {
      id: `reminder_${Date.now()}`,
      name: entry.applicant_name || "Unknown",
      passport_no: entry.passport_number,
      nationality: entry.nationality_id,
      ticket_no: "", // Will be filled manually or via OCR
      occupation: entry.occupation_name || "",
      test_center: testCenter,
      test_date: testDate,
      test_time: testTime,
      language: "en",
      linked_entry_id: entry.id,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    return reminder;
  }

  /**
   * Validate if a reminder can be linked to an entry
   * Checks if passport numbers match
   */
  static validateLinking(
    reminder: ExamReminder,
    entry: PassportEntry
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (reminder.passport_no !== entry.passport_number) {
      errors.push("Passport numbers do not match");
    }

    if (reminder.name && entry.applicant_name) {
      const reminderName = reminder.name.toLowerCase().trim();
      const entryName = entry.applicant_name.toLowerCase().trim();
      if (reminderName !== entryName) {
        errors.push("Applicant names do not match");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
