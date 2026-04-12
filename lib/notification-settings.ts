import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationSettings, EntryNotificationPreferences } from "./types";

const NOTIFICATION_SETTINGS_KEY = "labor_checker_notification_settings";
const ENTRY_PREFERENCES_KEY = "labor_checker_entry_preferences";

const DEFAULT_SETTINGS: NotificationSettings = {
  id: "global",
  soundEnabled: true,
  soundType: "default",
  vibrationEnabled: true,
  vibrationPattern: "medium",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  notificationsEnabled: true,
};

/**
 * Get global notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to get notification settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update global notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to update notification settings:", error);
    throw error;
  }
}

/**
 * Reset settings to default
 */
export async function resetNotificationSettings(): Promise<NotificationSettings> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to reset notification settings:", error);
    throw error;
  }
}

/**
 * Check if current time is within quiet hours
 */
export function isInQuietHours(
  quietHoursEnabled: boolean,
  quietHoursStart: string,
  quietHoursEnd: string
): boolean {
  if (!quietHoursEnabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  // Handle case where quiet hours span midnight
  if (quietHoursStart > quietHoursEnd) {
    return currentTime >= quietHoursStart || currentTime < quietHoursEnd;
  }

  return currentTime >= quietHoursStart && currentTime < quietHoursEnd;
}

/**
 * Get per-entry notification preferences
 */
export async function getEntryPreferences(
  entryId: string
): Promise<EntryNotificationPreferences> {
  try {
    const data = await AsyncStorage.getItem(ENTRY_PREFERENCES_KEY);
    const preferences = data ? JSON.parse(data) : {};
    return (
      preferences[entryId] || {
        entryId,
        notificationsEnabled: true,
      }
    );
  } catch (error) {
    console.error("Failed to get entry preferences:", error);
    return {
      entryId,
      notificationsEnabled: true,
    };
  }
}

/**
 * Update per-entry notification preferences
 */
export async function updateEntryPreferences(
  entryId: string,
  preferences: Partial<EntryNotificationPreferences>
): Promise<EntryNotificationPreferences> {
  try {
    const data = await AsyncStorage.getItem(ENTRY_PREFERENCES_KEY);
    const allPreferences = data ? JSON.parse(data) : {};

    const current = allPreferences[entryId] || {
      entryId,
      notificationsEnabled: true,
    };

    const updated = { ...current, ...preferences, entryId };
    allPreferences[entryId] = updated;

    await AsyncStorage.setItem(ENTRY_PREFERENCES_KEY, JSON.stringify(allPreferences));
    return updated;
  } catch (error) {
    console.error("Failed to update entry preferences:", error);
    throw error;
  }
}

/**
 * Mute notifications for an entry until specified time
 */
export async function muteEntryNotifications(
  entryId: string,
  durationMinutes: number
): Promise<EntryNotificationPreferences> {
  const muteUntil = Date.now() + durationMinutes * 60 * 1000;
  return updateEntryPreferences(entryId, { muteUntil });
}

/**
 * Unmute notifications for an entry
 */
export async function unmuteEntryNotifications(
  entryId: string
): Promise<EntryNotificationPreferences> {
  return updateEntryPreferences(entryId, { muteUntil: undefined });
}

/**
 * Check if entry notifications are muted
 */
export async function isEntryMuted(entryId: string): Promise<boolean> {
  try {
    const prefs = await getEntryPreferences(entryId);
    if (!prefs.muteUntil) return false;
    return Date.now() < prefs.muteUntil;
  } catch (error) {
    console.error("Failed to check if entry is muted:", error);
    return false;
  }
}

/**
 * Get all entry preferences
 */
export async function getAllEntryPreferences(): Promise<
  Record<string, EntryNotificationPreferences>
> {
  try {
    const data = await AsyncStorage.getItem(ENTRY_PREFERENCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to get all entry preferences:", error);
    return {};
  }
}

/**
 * Clear expired mutes
 */
export async function clearExpiredMutes(): Promise<void> {
  try {
    const allPreferences = await getAllEntryPreferences();
    const now = Date.now();

    Object.keys(allPreferences).forEach((entryId) => {
      const prefs = allPreferences[entryId];
      if (prefs.muteUntil && prefs.muteUntil <= now) {
        prefs.muteUntil = undefined;
      }
    });

    await AsyncStorage.setItem(ENTRY_PREFERENCES_KEY, JSON.stringify(allPreferences));
  } catch (error) {
    console.error("Failed to clear expired mutes:", error);
  }
}

/**
 * Determine if a notification should be sent based on settings
 */
export async function shouldSendNotification(entryId: string): Promise<boolean> {
  try {
    const globalSettings = await getNotificationSettings();
    const entryPrefs = await getEntryPreferences(entryId);

    // Check global notifications enabled
    if (!globalSettings.notificationsEnabled) return false;

    // Check entry notifications enabled
    if (!entryPrefs.notificationsEnabled) return false;

    // Check if entry is muted
    if (entryPrefs.muteUntil && Date.now() < entryPrefs.muteUntil) return false;

    // Check quiet hours
    if (
      isInQuietHours(
        globalSettings.quietHoursEnabled,
        globalSettings.quietHoursStart,
        globalSettings.quietHoursEnd
      )
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to determine if notification should be sent:", error);
    return false;
  }
}

/**
 * Get notification configuration for sending
 */
export async function getNotificationConfig(entryId: string) {
  try {
    const globalSettings = await getNotificationSettings();
    const entryPrefs = await getEntryPreferences(entryId);

    const soundEnabled =
      entryPrefs.soundEnabled !== undefined ? entryPrefs.soundEnabled : globalSettings.soundEnabled;
    const vibrationEnabled =
      entryPrefs.vibrationEnabled !== undefined
        ? entryPrefs.vibrationEnabled
        : globalSettings.vibrationEnabled;

    return {
      soundEnabled,
      soundType: globalSettings.soundType,
      vibrationEnabled,
      vibrationPattern: globalSettings.vibrationPattern,
    };
  } catch (error) {
    console.error("Failed to get notification config:", error);
    return {
      soundEnabled: true,
      soundType: "default" as const,
      vibrationEnabled: true,
      vibrationPattern: "medium" as const,
    };
  }
}
