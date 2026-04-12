import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useNotificationSettings } from "@/lib/notification-settings-provider";
import { NotificationSettings } from "@/lib/types";

export function NotificationSettingsScreen() {
  const colors = useColors();
  const { settings, loading, updateSettings } = useNotificationSettings();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [key]: !localSettings[key],
    });
  };

  const handleSoundTypeChange = (soundType: NotificationSettings["soundType"]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      soundType,
    });
  };

  const handleVibrationPatternChange = (
    vibrationPattern: NotificationSettings["vibrationPattern"]
  ) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      vibrationPattern,
    });
  };

  const handleTimeChange = (field: "quietHoursStart" | "quietHoursEnd", time: string) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [field]: time,
    });
  };

  const handleSave = async () => {
    if (!localSettings) return;

    setSaving(true);
    try {
      await updateSettings({
        soundEnabled: localSettings.soundEnabled,
        soundType: localSettings.soundType,
        vibrationEnabled: localSettings.vibrationEnabled,
        vibrationPattern: localSettings.vibrationPattern,
        quietHoursEnabled: localSettings.quietHoursEnabled,
        quietHoursStart: localSettings.quietHoursStart,
        quietHoursEnd: localSettings.quietHoursEnd,
        notificationsEnabled: localSettings.notificationsEnabled,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Notification settings saved");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !localSettings) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
    >
      {/* Master Toggle */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              Notifications
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              Enable or disable all notifications
            </Text>
          </View>
          <Switch
            value={localSettings.notificationsEnabled}
            onValueChange={() => handleToggle("notificationsEnabled")}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={localSettings.notificationsEnabled ? colors.primary : colors.muted}
          />
        </View>
      </View>

      {/* Sound Settings */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Sound Settings
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                Sound Enabled
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Play sound on notification
              </Text>
            </View>
            <Switch
              value={localSettings.soundEnabled}
              onValueChange={() => handleToggle("soundEnabled")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localSettings.soundEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {localSettings.soundEnabled && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {(["default", "chime", "bell", "notification", "silent"] as const).map(
              (soundType, index) => (
                <Pressable
                  key={soundType}
                  onPress={() => handleSoundTypeChange(soundType)}
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        localSettings.soundType === soundType ? colors.primary : colors.surface,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottomWidth: index < 4 ? 1 : 0,
                      borderBottomColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color:
                        localSettings.soundType === soundType ? "#fff" : colors.foreground,
                      textTransform: "capitalize",
                    }}
                  >
                    {soundType}
                  </Text>
                  {localSettings.soundType === soundType && (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </Pressable>
              )
            )}
          </View>
        )}
      </View>

      {/* Vibration Settings */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Vibration Settings
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                Vibration Enabled
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Vibrate on notification
              </Text>
            </View>
            <Switch
              value={localSettings.vibrationEnabled}
              onValueChange={() => handleToggle("vibrationEnabled")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localSettings.vibrationEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {localSettings.vibrationEnabled && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {(["light", "medium", "heavy"] as const).map((pattern, index) => (
              <Pressable
                key={pattern}
                onPress={() => handleVibrationPatternChange(pattern)}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      localSettings.vibrationPattern === pattern ? colors.primary : colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: index < 2 ? 1 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color:
                      localSettings.vibrationPattern === pattern ? "#fff" : colors.foreground,
                    textTransform: "capitalize",
                  }}
                >
                  {pattern}
                </Text>
                {localSettings.vibrationPattern === pattern && (
                  <MaterialIcons name="check" size={20} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Quiet Hours */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Quiet Hours
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>
                Enable Quiet Hours
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                Silence notifications during specific times
              </Text>
            </View>
            <Switch
              value={localSettings.quietHoursEnabled}
              onValueChange={() => handleToggle("quietHoursEnabled")}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={localSettings.quietHoursEnabled ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {localSettings.quietHoursEnabled && (
          <View style={{ gap: 12 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                Start Time
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {localSettings.quietHoursStart}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                End Time
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialIcons name="schedule" size={20} color={colors.primary} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {localSettings.quietHoursEnd}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            opacity: pressed || saving ? 0.7 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Save Settings
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
