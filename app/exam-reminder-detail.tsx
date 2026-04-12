import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { ExamRemindersService } from "@/lib/exam-reminders-service";
import { ExamReminder } from "@/lib/types";

export default function ExamReminderDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const [reminder, setReminder] = useState<ExamReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasReminder, setHasReminder] = useState(false);
  const [schedulingReminder, setSchedulingReminder] = useState(false);

  const reminderId = params.reminderId as string;

  // Load reminder on mount
  useEffect(() => {
    loadReminder();
  }, [reminderId]);

  const loadReminder = async () => {
    try {
      setLoading(true);
      const data = await ExamRemindersService.getReminderById(reminderId);
      setReminder(data);
      setHasReminder(data?.reminder_set || false);
    } catch (error) {
      console.error("Error loading reminder:", error);
      Alert.alert("Error", "Failed to load reminder");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReminder = async () => {
    if (!reminder) return;

    try {
      setSchedulingReminder(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Parse test date and time
      const [year, month, day] = reminder.test_date.split("-").map(Number);
      const [time, period] = reminder.test_time.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      // Convert to 24-hour format
      let hour24 = hours;
      if (period === "PM" && hours !== 12) hour24 = hours + 12;
      if (period === "AM" && hours === 12) hour24 = 0;

      // Create date for 24 hours before exam
      const testDate = new Date(year, month - 1, day, hour24, minutes);
      const reminderDate = new Date(testDate.getTime() - 24 * 60 * 60 * 1000);

      // Check if reminder date is in the future
      if (reminderDate <= new Date()) {
        Alert.alert("Error", "Reminder date must be in the future");
        return;
      }

      // Schedule notification
      const secondsFromNow = Math.floor((reminderDate.getTime() - Date.now()) / 1000);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Exam Reminder",
          body: `Your exam for ${reminder.occupation} is tomorrow at ${reminder.test_time}`,
          data: {
            reminderId: reminder.id,
            testCenter: reminder.test_center,
          },
        },
        trigger: {
          type: "time",
          seconds: Math.max(1, secondsFromNow),
        } as any,
      });

      // Update reminder with notification ID
      await ExamRemindersService.updateReminder(reminderId, {
        reminder_set: true,
        reminder_notification_id: notificationId,
      });

      setHasReminder(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Reminder scheduled for ${reminderDate.toLocaleString()}`);
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to schedule reminder");
    } finally {
      setSchedulingReminder(false);
    }
  };

  const handleCancelReminder = async () => {
    if (!reminder?.reminder_notification_id) return;

    try {
      setSchedulingReminder(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancel notification
      await Notifications.cancelScheduledNotificationAsync(reminder.reminder_notification_id);

      // Update reminder
      await ExamRemindersService.updateReminder(reminderId, {
        reminder_set: false,
        reminder_notification_id: undefined,
      });

      setHasReminder(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Reminder cancelled");
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to cancel reminder");
    } finally {
      setSchedulingReminder(false);
    }
  };

  const handleDeleteReminder = () => {
    Alert.alert("Delete Reminder", "Are you sure you want to delete this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Cancel notification if scheduled
            if (reminder?.reminder_notification_id) {
              await Notifications.cancelScheduledNotificationAsync(reminder.reminder_notification_id);
            }

            // Delete reminder
            await ExamRemindersService.deleteReminder(reminderId);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete reminder");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!reminder) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text style={{ fontSize: 16, color: colors.foreground }}>Reminder not found</Text>
      </ScreenContainer>
    );
  }

  const DetailField = ({ label, value }: { label: string; value: string }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground }}>
        {value}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              Exam Details
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Reminder Status Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <MaterialIcons
                name={hasReminder ? "notifications-active" : "notifications-none"}
                size={24}
                color={hasReminder ? colors.primary : colors.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  Reminder Status
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {hasReminder ? "Scheduled for 24 hours before exam" : "No reminder scheduled"}
                </Text>
              </View>
            </View>
          </View>

          {/* Exam Details */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              Exam Information
            </Text>

            <DetailField label="Applicant Name" value={reminder.name} />
            <DetailField label="Passport Number" value={reminder.passport_no} />
            <DetailField label="Nationality" value={reminder.nationality} />
            <DetailField label="Ticket Number" value={reminder.ticket_no} />
            <DetailField label="Occupation" value={reminder.occupation} />
            <DetailField
              label="Test Center"
              value={reminder.test_center}
            />
            <DetailField
              label="Test Date"
              value={new Date(reminder.test_date).toLocaleDateString()}
            />
            <DetailField label="Test Time" value={reminder.test_time} />
            <DetailField label="Language" value={reminder.language} />
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 20 }}>
            {!hasReminder ? (
              <Pressable
                onPress={handleScheduleReminder}
                disabled={schedulingReminder}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: pressed || schedulingReminder ? 0.7 : 1,
                  },
                ]}
              >
                {schedulingReminder ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialIcons name="notifications" size={20} color="white" />
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                      Set Reminder
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={handleCancelReminder}
                disabled={schedulingReminder}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.error || "#ef4444",
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: pressed || schedulingReminder ? 0.7 : 1,
                  },
                ]}
              >
                {schedulingReminder ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialIcons name="notifications-off" size={20} color="white" />
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                      Cancel Reminder
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={handleDeleteReminder}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.error || "#ef4444",
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error || "#ef4444"} />
              <Text style={{ color: colors.error || "#ef4444", fontSize: 16, fontWeight: "600" }}>
                Delete Reminder
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
