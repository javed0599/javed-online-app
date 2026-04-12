import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationSoundType = 'silent' | 'vibration' | 'sound-vibration';
export type StatusType = 'passed' | 'failed' | 'pending';

export interface NotificationPreferences {
  passed: NotificationSoundType;
  failed: NotificationSoundType;
  pending: NotificationSoundType;
  globalEnabled: boolean;
}

const STORAGE_KEY = 'notification_preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  passed: 'sound-vibration',
  failed: 'sound-vibration',
  pending: 'vibration',
  globalEnabled: true,
};

/**
 * Get notification preferences from storage
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences to storage
 */
export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    console.log('🔔 [Preferences] Saved notification preferences:', preferences);
  } catch (error) {
    console.error('Failed to save notification preferences:', error);
  }
}

/**
 * Update a specific status sound preference
 */
export async function updateStatusSoundPreference(
  status: StatusType,
  soundType: NotificationSoundType
): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    preferences[status] = soundType;
    await saveNotificationPreferences(preferences);
    console.log(`🔔 [Preferences] Updated ${status} sound to ${soundType}`);
  } catch (error) {
    console.error('Failed to update status sound preference:', error);
  }
}

/**
 * Toggle global notifications on/off
 */
export async function toggleGlobalNotifications(enabled: boolean): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    preferences.globalEnabled = enabled;
    await saveNotificationPreferences(preferences);
    console.log(`🔔 [Preferences] Global notifications ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Failed to toggle global notifications:', error);
  }
}

/**
 * Get sound preference for a specific status
 */
export async function getStatusSoundPreference(status: StatusType): Promise<NotificationSoundType> {
  try {
    const preferences = await getNotificationPreferences();
    return preferences[status];
  } catch (error) {
    console.error('Failed to get status sound preference:', error);
    return DEFAULT_PREFERENCES[status];
  }
}

/**
 * Check if notifications are globally enabled
 */
export async function isNotificationsEnabled(): Promise<boolean> {
  try {
    const preferences = await getNotificationPreferences();
    return preferences.globalEnabled;
  } catch (error) {
    console.error('Failed to check if notifications are enabled:', error);
    return true;
  }
}

/**
 * Reset preferences to defaults
 */
export async function resetNotificationPreferences(): Promise<void> {
  try {
    await saveNotificationPreferences(DEFAULT_PREFERENCES);
    console.log('🔔 [Preferences] Reset to default preferences');
  } catch (error) {
    console.error('Failed to reset notification preferences:', error);
  }
}

/**
 * Get sound configuration for notification
 */
export function getSoundConfig(soundType: NotificationSoundType): {
  sound: boolean;
  vibration: boolean;
} {
  switch (soundType) {
    case 'silent':
      return { sound: false, vibration: false };
    case 'vibration':
      return { sound: false, vibration: true };
    case 'sound-vibration':
      return { sound: true, vibration: true };
    default:
      return { sound: true, vibration: true };
  }
}

/**
 * Get display label for sound type
 */
export function getSoundTypeLabel(soundType: NotificationSoundType): string {
  switch (soundType) {
    case 'silent':
      return 'Silent';
    case 'vibration':
      return 'Vibration Only';
    case 'sound-vibration':
      return 'Sound + Vibration';
    default:
      return 'Sound + Vibration';
  }
}
