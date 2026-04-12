import React from "react";
import { View, Text, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface PollingIntervalSelector5MinProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PollingIntervalSelector5Min({
  isEnabled,
  onToggle,
}: PollingIntervalSelector5MinProps) {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: colors.muted,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        Automatic Status Checking
      </Text>

      <Pressable
        onPress={() => onToggle(!isEnabled)}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: isEnabled ? colors.primary : colors.border,
            backgroundColor: isEnabled ? `${colors.primary}15` : colors.surface,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isEnabled ? colors.primary : colors.border,
            backgroundColor: isEnabled ? colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isEnabled && (
            <MaterialIcons name="check" size={16} color={colors.background} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            Check Every 5 Minutes
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
              marginTop: 4,
            }}
          >
            {isEnabled
              ? "Automatically checking status every 5 minutes"
              : "Tap to enable automatic checking"}
          </Text>
        </View>

        <MaterialIcons
          name={isEnabled ? "check-circle" : "radio-button-unchecked"}
          size={24}
          color={isEnabled ? colors.primary : colors.muted}
        />
      </Pressable>

      {isEnabled && (
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: `${colors.primary}10`,
            borderRadius: 6,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text
              style={{
                fontSize: 12,
                color: colors.primary,
                flex: 1,
              }}
            >
              You will receive phone notifications when status changes
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
