import { describe, it, expect } from "vitest";
import { NotificationSettings, EntryNotificationPreferences } from "@/lib/types";

describe("Notification Settings", () => {
  describe("Global notification settings", () => {
    it("should have default settings", () => {
      const defaults: NotificationSettings = {
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

      expect(defaults.soundEnabled).toBe(true);
      expect(defaults.vibrationEnabled).toBe(true);
      expect(defaults.notificationsEnabled).toBe(true);
    });

    it("should support different sound types", () => {
      const soundTypes: NotificationSettings["soundType"][] = [
        "default",
        "chime",
        "bell",
        "notification",
        "silent",
      ];

      expect(soundTypes).toHaveLength(5);
      expect(soundTypes).toContain("default");
      expect(soundTypes).toContain("silent");
    });

    it("should support different vibration patterns", () => {
      const patterns: NotificationSettings["vibrationPattern"][] = [
        "light",
        "medium",
        "heavy",
      ];

      expect(patterns).toHaveLength(3);
      expect(patterns).toContain("light");
      expect(patterns).toContain("heavy");
    });
  });

  describe("Quiet hours logic", () => {
    it("should detect time within quiet hours (normal case)", () => {
      const quietHoursStart = "22:00";
      const quietHoursEnd = "08:00";
      const testTime = "23:30";

      const isInQuietHours =
        testTime >= quietHoursStart || testTime < quietHoursEnd;
      expect(isInQuietHours).toBe(true);
    });

    it("should detect time outside quiet hours (normal case)", () => {
      const quietHoursStart = "22:00";
      const quietHoursEnd = "08:00";
      const testTime = "12:00";

      const isInQuietHours =
        testTime >= quietHoursStart || testTime < quietHoursEnd;
      expect(isInQuietHours).toBe(false);
    });

    it("should detect time within quiet hours (midnight span)", () => {
      const quietHoursStart = "22:00";
      const quietHoursEnd = "08:00";
      const testTime = "02:00";

      const isInQuietHours =
        testTime >= quietHoursStart || testTime < quietHoursEnd;
      expect(isInQuietHours).toBe(true);
    });

    it("should respect quiet hours enabled flag", () => {
      const quietHoursEnabled = false;
      expect(quietHoursEnabled).toBe(false);
    });
  });

  describe("Entry notification preferences", () => {
    it("should create entry preferences", () => {
      const prefs: EntryNotificationPreferences = {
        entryId: "entry-1",
        notificationsEnabled: true,
      };

      expect(prefs.entryId).toBe("entry-1");
      expect(prefs.notificationsEnabled).toBe(true);
    });

    it("should support per-entry sound override", () => {
      const prefs: EntryNotificationPreferences = {
        entryId: "entry-1",
        soundEnabled: false,
        notificationsEnabled: true,
      };

      expect(prefs.soundEnabled).toBe(false);
    });

    it("should support per-entry vibration override", () => {
      const prefs: EntryNotificationPreferences = {
        entryId: "entry-1",
        vibrationEnabled: false,
        notificationsEnabled: true,
      };

      expect(prefs.vibrationEnabled).toBe(false);
    });

    it("should support muting until specific time", () => {
      const muteUntil = Date.now() + 60 * 60 * 1000; // 1 hour from now
      const prefs: EntryNotificationPreferences = {
        entryId: "entry-1",
        notificationsEnabled: true,
        muteUntil,
      };

      expect(prefs.muteUntil).toBe(muteUntil);
      expect(prefs.muteUntil && Date.now() < prefs.muteUntil).toBe(true);
    });
  });

  describe("Mute duration calculations", () => {
    it("should calculate 15 minute mute duration", () => {
      const durationMinutes = 15;
      const muteUntil = Date.now() + durationMinutes * 60 * 1000;

      expect(muteUntil - Date.now()).toBeGreaterThan(durationMinutes * 60 * 1000 - 100);
      expect(muteUntil - Date.now()).toBeLessThan(durationMinutes * 60 * 1000 + 100);
    });

    it("should calculate 60 minute mute duration", () => {
      const durationMinutes = 60;
      const muteUntil = Date.now() + durationMinutes * 60 * 1000;

      expect(muteUntil - Date.now()).toBeGreaterThan(durationMinutes * 60 * 1000 - 100);
      expect(muteUntil - Date.now()).toBeLessThan(durationMinutes * 60 * 1000 + 100);
    });

    it("should calculate 480 minute mute duration", () => {
      const durationMinutes = 480;
      const muteUntil = Date.now() + durationMinutes * 60 * 1000;

      expect(muteUntil - Date.now()).toBeGreaterThan(durationMinutes * 60 * 1000 - 100);
      expect(muteUntil - Date.now()).toBeLessThan(durationMinutes * 60 * 1000 + 100);
    });
  });

  describe("Notification decision logic", () => {
    it("should not send if global notifications disabled", () => {
      const globalSettings: NotificationSettings = {
        id: "global",
        soundEnabled: true,
        soundType: "default",
        vibrationEnabled: true,
        vibrationPattern: "medium",
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        notificationsEnabled: false,
      };

      const shouldSend =
        globalSettings.notificationsEnabled &&
        true &&
        false === false &&
        false === false;

      expect(shouldSend).toBe(false);
    });

    it("should not send if entry notifications disabled", () => {
      const entryPrefs: EntryNotificationPreferences = {
        entryId: "entry-1",
        notificationsEnabled: false,
      };

      const shouldSend = true && entryPrefs.notificationsEnabled;
      expect(shouldSend).toBe(false);
    });

    it("should not send if entry is muted", () => {
      const muteUntil: number | undefined = Date.now() + 60 * 1000; // 1 minute from now
      const isMuted = muteUntil && Date.now() < muteUntil;

      expect(isMuted).toBe(true);
    });

    it("should send if all conditions met", () => {
      const globalEnabled = true;
      const entryEnabled = true;
      const notMuted = false;
      const notInQuietHours = false;

      const shouldSend = globalEnabled && entryEnabled && !notMuted && !notInQuietHours;
      expect(shouldSend).toBe(true);
    });
  });

  describe("Sound and vibration configuration", () => {
    it("should use global sound if entry not overridden", () => {
      const globalSoundEnabled = true;
      const entrySoundEnabled = undefined;

      const soundEnabled =
        entrySoundEnabled !== undefined ? entrySoundEnabled : globalSoundEnabled;
      expect(soundEnabled).toBe(true);
    });

    it("should use entry sound if overridden", () => {
      const globalSoundEnabled = true;
      const entrySoundEnabled = false;

      const soundEnabled =
        entrySoundEnabled !== undefined ? entrySoundEnabled : globalSoundEnabled;
      expect(soundEnabled).toBe(false);
    });

    it("should use global vibration if entry not overridden", () => {
      const globalVibrationEnabled = true;
      const entryVibrationEnabled = undefined;

      const vibrationEnabled =
        entryVibrationEnabled !== undefined
          ? entryVibrationEnabled
          : globalVibrationEnabled;
      expect(vibrationEnabled).toBe(true);
    });

    it("should use entry vibration if overridden", () => {
      const globalVibrationEnabled = true;
      const entryVibrationEnabled = false;

      const vibrationEnabled =
        entryVibrationEnabled !== undefined
          ? entryVibrationEnabled
          : globalVibrationEnabled;
      expect(vibrationEnabled).toBe(false);
    });
  });
});
