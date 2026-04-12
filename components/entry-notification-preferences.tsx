import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useNotificationSettings } from "@/lib/notification-settings-provider";
import { EntryNotificationPreferences } from "@/lib/types";

interface EntryNotificationPreferencesProps {
  entryId: string;
  passportNumber: string;
}

export function EntryNotificationPreferences({
  entryId,
  passportNumber,
}: EntryNotificationPreferencesProps) {
  const colors = useColors();
  const { getEntryPrefs, updateEntryPrefs, muteEntry, unmuteEntry, checkIfMuted } =
    useNotificationSettings();
  const [prefs, setPrefs] = useState<EntryNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [entryId]);

  const loadPreferences = async () => {
    try {
      const preferences = await getEntryPrefs(entryId);
      setPrefs(preferences);
      const muted = await checkIfMuted(entryId);
      setIsMuted(muted);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!prefs) return;

    try {
      await updateEntryPrefs(entryId, {
        notificationsEnabled: !prefs.notificationsEnabled,
      });
      setPrefs({
        ...prefs,
        notificationsEnabled: !prefs.notificationsEnabled,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert("Error", "Failed to update preferences");
    }
  };

  const handleToggleSound = async () => {
    if (!prefs) return;

    try {
      const newValue = prefs.soundEnabled !== undefined ? !prefs.soundEnabled : true;
      await updateEntryPrefs(entryId, {
        soundEnabled: newValue,
      });
      setPrefs({
        ...prefs,
        soundEnabled: newValue,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert("Error", "Failed to update preferences");
    }
  };

  const handleToggleVibration = async () => {
    if (!prefs) return;

    try {
      const newValue = prefs.vibrationEnabled !== undefined ? !prefs.vibrationEnabled : true;
      await updateEntryPrefs(entryId, {
        vibrationEnabled: newValue,
      });
      setPrefs({
        ...prefs,
        vibrationEnabled: newValue,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert("Error", "Failed to update preferences");
    }
  };

  const handleMute = async (minutes: number) => {
    try {
      await muteEntry(entryId, minutes);
      setIsMuted(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Muted", `Notifications muted for ${minutes} minutes`);
    } catch (error) {
      Alert.alert("Error", "Failed to mute notifications");
    }
  };

  const handleUnmute = async () => {
    try {
      await unmuteEntry(entryId);
      setIsMuted(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Unmuted", "Notifications restored");
    } catch (error) {
      Alert.alert("Error", "Failed to unmute notifications");
    }
  };

  if (loading || !prefs) {
    return <ActivityIndicator size="small" color={colors.primary} />;
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Master Toggle */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              Notifications
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {passportNumber}
            </Text>
          </View>
          <Switch
            value={prefs.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={prefs.notificationsEnabled ? colors.primary : colors.muted}
          />
        </View>
      </View>

      {prefs.notificationsEnabled && (
        <>
          {/* Sound Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                  Sound
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Use global setting if not set
                </Text>
              </View>
              <Switch
                value={prefs.soundEnabled !== undefined ? prefs.soundEnabled : true}
                onValueChange={handleToggleSound}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={
                  prefs.soundEnabled !== undefined && prefs.soundEnabled
                    ? colors.primary
                    : colors.muted
                }
              />
            </View>
          </View>

          {/* Vibration Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                  Vibration
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  Use global setting if not set
                </Text>
              </View>
              <Switch
                value={prefs.vibrationEnabled !== undefined ? prefs.vibrationEnabled : true}
                onValueChange={handleToggleVibration}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={
                  prefs.vibrationEnabled !== undefined && prefs.vibrationEnabled
                    ? colors.primary
                    : colors.muted
                }
              />
            </View>
          </View>

          {/* Mute Options */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                Mute Notifications
              </Text>
              {isMuted && (
                <Text style={{ fontSize: 11, color: colors.warning, marginTop: 4 }}>
                  Currently muted
                </Text>
              )}
            </View>

            {isMuted ? (
              <Pressable
                onPress={handleUnmute}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <MaterialIcons name="notifications-active" size={18} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.primary }}>
                  Unmute Now
                </Text>
              </Pressable>
            ) : (
              <>
                {[15, 60, 480].map((minutes, index) => (
                  <Pressable
                    key={minutes}
                    onPress={() => handleMute(minutes)}
                    style={({ pressed }) => [
                      {
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                      {minutes === 15
                        ? "15 minutes"
                        : minutes === 60
                          ? "1 hour"
                          : "8 hours"}
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}
