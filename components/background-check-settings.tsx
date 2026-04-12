import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import {
  isNotificationsEnabled,
  setNotificationsEnabled,
  getCheckInterval,
  setCheckInterval,
} from "@/lib/background-scheduler";

interface BackgroundCheckSettingsProps {
  entryId: string;
  passportNumber: string;
}

export function BackgroundCheckSettings({
  entryId,
  passportNumber,
}: BackgroundCheckSettingsProps) {
  const colors = useColors();
  const [notificationsEnabled, setNotificationsEnabledLocal] = useState(false);
  const [checkInterval, setCheckIntervalLocal] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [entryId]);

  const loadSettings = async () => {
    try {
      const enabled = await isNotificationsEnabled(entryId);
      const interval = await getCheckInterval(entryId);
      setNotificationsEnabledLocal(enabled);
      setCheckIntervalLocal(interval);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabledLocal(value);
    await setNotificationsEnabled(entryId, value);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSetInterval = async (minutes: number) => {
    setCheckIntervalLocal(minutes);
    await setCheckInterval(entryId, minutes);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Notifications Toggle */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons
              name="notifications-active"
              size={24}
              color={colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              Auto-Check Status
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={notificationsEnabled ? colors.primary : "#f4f3f4"}
            ios_backgroundColor={colors.border}
          />
        </View>

        {notificationsEnabled && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginBottom: 8,
                fontWeight: "500",
              }}
            >
              Check Interval
            </Text>
            <View style={{ gap: 8 }}>
              {[
                { label: "5 minutes", value: 5 },
                { label: "15 minutes", value: 15 },
                { label: "30 minutes", value: 30 },
                { label: "1 hour", value: 60 },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSetInterval(option.value)}
                  style={({ pressed }) => [
                    styles.intervalButton,
                    {
                      backgroundColor:
                        checkInterval === option.value
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        checkInterval === option.value
                          ? colors.primary
                          : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        checkInterval === option.value
                          ? "#fff"
                          : colors.foreground,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {option.label}
                  </Text>
                  {checkInterval === option.value && (
                    <MaterialIcons name="check" size={20} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>

            <View
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: colors.background,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: colors.warning,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: colors.muted,
                  lineHeight: 18,
                }}
              >
                Status will be checked automatically at the selected interval. You'll receive a notification if the result changes.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Box */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.background,
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            lineHeight: 18,
          }}
        >
          <Text style={{ fontWeight: "600" }}>Passport:</Text> {passportNumber}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  intervalButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
