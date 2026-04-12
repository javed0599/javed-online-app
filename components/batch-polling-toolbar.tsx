import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export interface BatchPollingToolbarProps {
  selectedCount: number;
  onStartPolling: () => void;
  onStopPolling: () => void;
  onChangeInterval: () => void;
  onClearSelection: () => void;
}

export function BatchPollingToolbar({
  selectedCount,
  onStartPolling,
  onStopPolling,
  onChangeInterval,
  onClearSelection,
}: BatchPollingToolbarProps) {
  const colors = useColors();

  if (selectedCount === 0) {
    return null;
  }

  const handleAction = (action: () => void, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.background }}>
              {selectedCount}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {selectedCount} {selectedCount === 1 ? "entry" : "entries"} selected
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClearSelection();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <MaterialIcons name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => handleAction(onStartPolling, "Start")}
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.success,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialIcons name="play-arrow" size={18} color={colors.background} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.background }}>Start</Text>
        </Pressable>

        <Pressable
          onPress={() => handleAction(onStopPolling, "Stop")}
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.error,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialIcons name="stop" size={18} color={colors.background} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.background }}>Stop</Text>
        </Pressable>

        <Pressable
          onPress={() => handleAction(onChangeInterval, "Interval")}
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <MaterialIcons name="schedule" size={18} color={colors.background} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.background }}>Interval</Text>
        </Pressable>
      </View>
    </View>
  );
}
