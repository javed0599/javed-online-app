import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface PollingCountdownProps {
  isPolling: boolean;
  intervalMs: number;
  lastFetchTime?: number | null;
}

export function PollingCountdown({
  isPolling,
  intervalMs,
  lastFetchTime,
}: PollingCountdownProps) {
  const colors = useColors();
  const [timeUntilNext, setTimeUntilNext] = useState<number | null>(null);

  useEffect(() => {
    if (!isPolling || !lastFetchTime) {
      setTimeUntilNext(null);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const nextCheckTime = lastFetchTime + intervalMs;
      const remaining = Math.max(0, nextCheckTime - now);

      if (remaining === 0) {
        setTimeUntilNext(null);
      } else {
        setTimeUntilNext(remaining);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateCountdown, 100);

    return () => clearInterval(interval);
  }, [isPolling, intervalMs, lastFetchTime]);

  if (!isPolling || timeUntilNext === null) {
    return null;
  }

  const seconds = Math.floor((timeUntilNext / 1000) % 60);
  const minutes = Math.floor((timeUntilNext / (1000 * 60)) % 60);
  const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));

  let timeString = "";
  if (hours > 0) {
    timeString = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    timeString = `${minutes}m ${seconds}s`;
  } else {
    timeString = `${seconds}s`;
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        gap: 8,
        marginBottom: 12,
      }}
    >
      <MaterialIcons name="schedule" size={16} color={colors.primary} />
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.primary,
          flex: 1,
        }}
      >
        Next check in: {timeString}
      </Text>
    </View>
  );
}
