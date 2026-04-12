import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { WebTabBar } from "@/components/web-tab-bar";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import {
  getNotificationLogs,
  markNotificationAsRead,
  deleteNotificationLog,
  clearAllNotificationLogs,
  getNotificationStatistics,
  getUnreadNotificationCount,
} from "@/lib/notification-history";
import { NotificationLog } from "@/lib/types";

export default function NotificationHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    passedCount: 0,
    failedCount: 0,
    pendingCount: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "passed" | "failed" | "pending" | "unread"
  >("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const logs = await getNotificationLogs();
      const statistics = await getNotificationStatistics();
      setNotifications(logs);
      setStats(statistics);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      Alert.alert("Error", "Failed to load notification history");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (logId: string) => {
    try {
      await markNotificationAsRead(logId);
      await loadNotifications();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert("Error", "Failed to mark notification as read");
    }
  };

  const handleDelete = async (logId: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNotificationLog(logId);
            await loadNotifications();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Error", "Failed to delete notification");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "This will delete all notification history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllNotificationLogs();
              await loadNotifications();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert("Error", "Failed to clear notifications");
            }
          },
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case "passed":
        return notifications.filter((n) => n.currentStatus === "passed");
      case "failed":
        return notifications.filter((n) => n.currentStatus === "failed");
      case "pending":
        return notifications.filter((n) => n.currentStatus === "pending");
      case "unread":
        return notifications.filter((n) => !n.read);
      default:
        return notifications;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "passed") return "#22c55e";
    if (status === "failed") return "#ef4444";
    return "#f59e0b";
  };

  const getStatusLabel = (status: string) => {
    if (status === "passed") return "Passed";
    if (status === "failed") return "Failed";
    return "Pending";
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotificationItem = ({ item }: { item: NotificationLog }) => (
    <Pressable
      onPress={() => handleMarkAsRead(item.id)}
      style={({ pressed }) => [
        {
          backgroundColor: item.read ? colors.surface : colors.background,
          borderColor: item.read ? colors.border : colors.primary,
          borderLeftWidth: item.read ? 1 : 3,
          borderLeftColor: item.read ? colors.border : colors.primary,
          opacity: pressed ? 0.7 : 1,
        },
        {
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            {item.passportNumber}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.muted,
            }}
          >
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {!item.read && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          )}
          <Pressable
            onPress={() => handleDelete(item.id)}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons name="delete" size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Status Change:</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: getStatusColor(item.previousStatus),
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                {getStatusLabel(item.previousStatus)}
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={16} color={colors.muted} />
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: getStatusColor(item.currentStatus),
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                {getStatusLabel(item.currentStatus)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Test Center:</Text>
          <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "500" }}>
            {item.testCenterName}
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Exam Date:</Text>
          <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "500" }}>
            {item.examDate}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenContainer className="flex items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </ScreenContainer>
        <WebTabBar />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer className="flex-1 p-0" edges={["top", "left", "right", "bottom"]}>
        <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Pressable onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
              </Pressable>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.foreground,
                }}
              >
                Notification History
              </Text>
              <Pressable onPress={handleClearAll} disabled={notifications.length === 0}>
                <MaterialIcons
                  name="delete-sweep"
                  size={24}
                  color={notifications.length === 0 ? colors.muted : colors.error}
                />
              </Pressable>
            </View>

            {/* Statistics */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary }}>
                    {stats.totalNotifications}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Total
                  </Text>
                </View>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: "#22c55e" }}>
                    {stats.passedCount}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Passed
                  </Text>
                </View>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: "#ef4444" }}>
                    {stats.failedCount}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Failed
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#f59e0b" }}>
                    {stats.pendingCount}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Pending
                  </Text>
                </View>
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                    {stats.unreadNotifications}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Unread
                  </Text>
                </View>
              </View>
            </View>

            {/* Filter Buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(["all", "passed", "failed", "pending", "unread"] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      marginRight: 8,
                      backgroundColor:
                        selectedFilter === filter ? colors.primary : colors.surface,
                      borderWidth: selectedFilter === filter ? 0 : 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        selectedFilter === filter ? "#fff" : colors.foreground,
                      textTransform: "capitalize",
                    }}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MaterialIcons name="notifications-none" size={48} color={colors.muted} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.foreground,
                marginTop: 16,
              }}
            >
              No Notifications
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Status change alerts will appear here
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
      </ScreenContainer>
      <WebTabBar />
    </View>
  );
}
