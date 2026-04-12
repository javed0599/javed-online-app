import React from "react";
import { View, Text, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface PollingStatusIndicatorProps {
  status: "polling" | "idle" | "error";
  lastFetchTime?: number | null;
  retryCount?: number;
  error?: string | null;
}

export function PollingStatusIndicator({
  status,
  lastFetchTime,
  retryCount,
  error,
}: PollingStatusIndicatorProps) {
  const colors = useColors();
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (status === "polling") {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [status, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getStatusColor = () => {
    if (status === "polling") return colors.primary;
    if (status === "error") return colors.error;
    return colors.muted;
  };

  const getStatusIcon = () => {
    if (status === "polling") return "sync";
    if (status === "error") return "error-outline";
    return "check-circle";
  };

  const getStatusText = () => {
    if (status === "polling") return "Checking...";
    if (status === "error") return "Check Failed";
    return "Idle";
  };

  const formatLastFetchTime = () => {
    if (!lastFetchTime) return "";
    const now = Date.now();
    const diff = now - lastFetchTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

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
        borderColor: colors.border,
        gap: 8,
      }}
    >
      <Animated.View style={{ transform: [{ rotate: status === "polling" ? spin : "0deg" }] }}>
        <MaterialIcons name={getStatusIcon()} size={16} color={getStatusColor()} />
      </Animated.View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: getStatusColor(),
          }}
        >
          {getStatusText()}
        </Text>
        {lastFetchTime && (
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 2,
            }}
          >
            Last: {formatLastFetchTime()}
          </Text>
        )}
      </View>

      {status === "error" && retryCount && (
        <Text
          style={{
            fontSize: 11,
            color: colors.error,
            fontWeight: "500",
          }}
        >
          Retry {retryCount}
        </Text>
      )}

      {error && status === "error" && (
        <View
          style={{
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: `${colors.error}15`,
            borderRadius: 6,
            borderLeftWidth: 3,
            borderLeftColor: colors.error,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.error,
              fontWeight: "500",
            }}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
