import React, { createContext, useContext, useState, useEffect } from "react";
import { NotificationSettings, EntryNotificationPreferences } from "./types";
import {
  getNotificationSettings,
  updateNotificationSettings,
  getEntryPreferences,
  updateEntryPreferences,
  muteEntryNotifications,
  unmuteEntryNotifications,
  isEntryMuted,
} from "./notification-settings";

interface NotificationSettingsContextType {
  settings: NotificationSettings | null;
  entryPreferences: Record<string, EntryNotificationPreferences>;
  loading: boolean;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  getEntryPrefs: (entryId: string) => Promise<EntryNotificationPreferences>;
  updateEntryPrefs: (
    entryId: string,
    prefs: Partial<EntryNotificationPreferences>
  ) => Promise<void>;
  muteEntry: (entryId: string, durationMinutes: number) => Promise<void>;
  unmuteEntry: (entryId: string) => Promise<void>;
  checkIfMuted: (entryId: string) => Promise<boolean>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(
  undefined
);

export function NotificationSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [entryPreferences, setEntryPreferences] = useState<
    Record<string, EntryNotificationPreferences>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const globalSettings = await getNotificationSettings();
      setSettings(globalSettings);
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = await updateNotificationSettings(newSettings);
      setSettings(updated);
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  };

  const getEntryPrefs = async (entryId: string) => {
    try {
      const prefs = await getEntryPreferences(entryId);
      setEntryPreferences((prev) => ({ ...prev, [entryId]: prefs }));
      return prefs;
    } catch (error) {
      console.error("Failed to get entry preferences:", error);
      throw error;
    }
  };

  const updateEntryPrefs = async (
    entryId: string,
    prefs: Partial<EntryNotificationPreferences>
  ) => {
    try {
      const updated = await updateEntryPreferences(entryId, prefs);
      setEntryPreferences((prev) => ({ ...prev, [entryId]: updated }));
    } catch (error) {
      console.error("Failed to update entry preferences:", error);
      throw error;
    }
  };

  const muteEntry = async (entryId: string, durationMinutes: number) => {
    try {
      const updated = await muteEntryNotifications(entryId, durationMinutes);
      setEntryPreferences((prev) => ({ ...prev, [entryId]: updated }));
    } catch (error) {
      console.error("Failed to mute entry:", error);
      throw error;
    }
  };

  const unmuteEntry = async (entryId: string) => {
    try {
      const updated = await unmuteEntryNotifications(entryId);
      setEntryPreferences((prev) => ({ ...prev, [entryId]: updated }));
    } catch (error) {
      console.error("Failed to unmute entry:", error);
      throw error;
    }
  };

  const checkIfMuted = async (entryId: string) => {
    try {
      return await isEntryMuted(entryId);
    } catch (error) {
      console.error("Failed to check if entry is muted:", error);
      return false;
    }
  };

  return (
    <NotificationSettingsContext.Provider
      value={{
        settings,
        entryPreferences,
        loading,
        updateSettings,
        getEntryPrefs,
        updateEntryPrefs,
        muteEntry,
        unmuteEntry,
        checkIfMuted,
      }}
    >
      {children}
    </NotificationSettingsContext.Provider>
  );
}

export function useNotificationSettings() {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error(
      "useNotificationSettings must be used within NotificationSettingsProvider"
    );
  }
  return context;
}
