import React, { useEffect, useState } from "react";
import { View, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { getUnreadNotificationCount } from "@/lib/notification-history";
import * as Haptics from "expo-haptics";

export function NotificationHistoryButton() {
  const router = useRouter();
  const colors = useColors();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Refresh unread count every 5 seconds
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/notification-history");
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          position: "relative",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <MaterialIcons name="notifications" size={24} color={colors.primary} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            backgroundColor: colors.error,
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
