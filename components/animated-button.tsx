import React, { useRef, useEffect } from "react";
import {
  Pressable,
  Text,
  View,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "warning";
export type ButtonSize = "small" | "medium" | "large";

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantColors = {
  primary: {
    start: "#0a7ea4",
    end: "#0d9488",
    text: "#ffffff",
  },
  secondary: {
    start: "#6366f1",
    end: "#8b5cf6",
    text: "#ffffff",
  },
  success: {
    start: "#22c55e",
    end: "#16a34a",
    text: "#ffffff",
  },
  danger: {
    start: "#ef4444",
    end: "#dc2626",
    text: "#ffffff",
  },
  warning: {
    start: "#f59e0b",
    end: "#d97706",
    text: "#ffffff",
  },
};

const sizeStyles = {
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: 6,
    height: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderRadius: 8,
    height: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
    borderRadius: 10,
    height: 56,
  },
};

export function AnimatedButton({
  onPress,
  title,
  variant = "primary",
  size = "medium",
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: AnimatedButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const variantColor = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  const handlePressIn = () => {
    if (disabled || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View
      style={[
        {
          width: fullWidth ? "100%" : "auto",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingHorizontal: sizeStyle.paddingHorizontal,
              paddingVertical: sizeStyle.paddingVertical,
              borderRadius: sizeStyle.borderRadius,
              height: sizeStyle.height,
              backgroundColor: variantColor.start,
              opacity: disabled ? 0.5 : 1,
              overflow: "hidden",
            },
          ]}
        >
          {/* Glow effect background */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#ffffff",
                opacity: glowOpacity,
                borderRadius: sizeStyle.borderRadius,
              },
            ]}
          />

          {/* Content */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              zIndex: 1,
            }}
          >
            {icon && !loading && (
              <MaterialIcons
                name={icon as any}
                size={size === "small" ? 14 : size === "medium" ? 18 : 22}
                color={variantColor.text}
              />
            )}

            {loading && (
              <Animated.View
                style={[
                  {
                    width: size === "small" ? 14 : size === "medium" ? 18 : 22,
                    height: size === "small" ? 14 : size === "medium" ? 18 : 22,
                  },
                ]}
              >
                <MaterialIcons
                  name="hourglass-empty"
                  size={size === "small" ? 14 : size === "medium" ? 18 : 22}
                  color={variantColor.text}
                />
              </Animated.View>
            )}

            <Text
              style={{
                fontSize: sizeStyle.fontSize,
                fontWeight: "600",
                color: variantColor.text,
              }}
            >
              {title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/**
 * Floating Action Button with bounce animation
 */
interface AnimatedFABProps {
  onPress: () => void;
  icon: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AnimatedFAB({
  onPress,
  icon,
  disabled = false,
  style,
}: AnimatedFABProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation on mount
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim]);

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim },
          ],
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <MaterialIcons name={icon as any} size={28} color="#ffffff" />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Icon button with rotation animation
 */
interface AnimatedIconButtonProps {
  onPress: () => void;
  icon: string;
  color?: string;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AnimatedIconButton({
  onPress,
  icon,
  color,
  size = 24,
  disabled = false,
  style,
}: AnimatedIconButtonProps) {
  const colors = useColors();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [
            { rotate: rotation },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <MaterialIcons
          name={icon as any}
          size={size}
          color={color || colors.primary}
        />
      </Pressable>
    </Animated.View>
  );
}
