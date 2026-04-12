import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

interface SuccessToastProps {
  visible: boolean;
  message?: string;
  duration?: number;
  onHide?: () => void;
}

export function SuccessToast({
  visible,
  message = "Success",
  duration = 1000,
  onHide,
}: SuccessToastProps) {
  const colors = useColors();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: "#10B981",
            shadowColor: "#10B981",
          },
        ]}
      >
        <MaterialIcons name="check-circle" size={20} color="white" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
