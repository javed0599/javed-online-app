import React, { useState, useEffect } from "react";
import { View, Text, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface AutoCheckIndicatorProps {
  isActive: boolean;
  lastCheckTime?: number | null;
  nextCheckTime?: number | null;
}

export function AutoCheckIndicator({
  isActive,
  lastCheckTime,
  nextCheckTime,
}: AutoCheckIndicatorProps) {
  const colors = useColors();
  const [spinValue] = useState(new Animated.Value(0));
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Increment check count every minute
      const interval = setInterval(() => {
        setCheckCount((prev) => prev + 1);
      }, 60000);

      return () => clearInterval(interval);
    } else {
      spinValue.setValue(0);
      setCheckCount(0);
    }
  }, [isActive, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!isActive) {
    return null;
  }

  const formatTime = (timestamp: number | null | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.success,
        gap: 8,
      }}
    >
      {/* Header with spinning icon */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="sync" size={20} color={colors.success} />
        </Animated.View>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success, flex: 1 }}>
          Auto-Check Active
        </Text>
        <View
          style={{
            backgroundColor: colors.success,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.background }}>
            {checkCount} checks
          </Text>
        </View>
      </View>

      {/* Check times */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Last Check:</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
            {formatTime(lastCheckTime)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Next Check:</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
            {formatTime(nextCheckTime)}
          </Text>
        </View>
      </View>

      {/* Status message */}
      <Text style={{ fontSize: 11, color: colors.muted, fontStyle: "italic" }}>
        Checking every 1 minute for status updates
      </Text>
    </View>
  );
}
