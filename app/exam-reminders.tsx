import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { WebTabBar } from "@/components/web-tab-bar";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ExamRemindersService } from "@/lib/exam-reminders-service";
import { OCRService } from "@/lib/ocr-service";
import { ExamReminder } from "@/lib/types";

export default function ExamRemindersScreen() {
  const router = useRouter();
  const colors = useColors();
  const [reminders, setReminders] = useState<ExamReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "unscheduled" | "expired">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRescheduleDate, setBulkRescheduleDate] = useState<string>("");

  // Load reminders on mount
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await ExamRemindersService.getAllReminders();
      setReminders(data);
    } catch (error) {
      console.error("Error loading reminders:", error);
      Alert.alert("Error", "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    Alert.alert("Coming Soon", "Image picker will be available in the next update");
  };

  const takePhoto = async () => {
    Alert.alert("Coming Soon", "Camera capture will be available in the next update");
  };

  const processImage = async (imageUri: string) => {
    try {
      setExtracting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Extract data from image
      const extractedData = await OCRService.extractFromImage(imageUri);

      // Validate extraction
      const validation = OCRService.validateExtractedData(extractedData);

      if (!validation.valid) {
        Alert.alert(
          "Extraction Issues",
          `Some fields could not be extracted:\n\n${validation.errors.join("\n")}\n\nPlease review and edit the data.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: () => {
                // TODO: Navigate to exam-reminder-form
                Alert.alert("Info", "Form screen coming soon");
              },
            },
          ]
        );
      } else {
        // Navigate to form with extracted data
        // TODO: Navigate to exam-reminder-form
        Alert.alert("Info", "Form screen coming soon");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to process image");
    } finally {
      setExtracting(false);
    }
  };

  const handleDeleteReminder = (id: string) => {
    Alert.alert("Delete Reminder", "Are you sure you want to delete this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ExamRemindersService.deleteReminder(id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadReminders();
          } catch (error) {
            Alert.alert("Error", "Failed to delete reminder");
          }
        },
      },
    ]);
  };

  const toggleSelection = async (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      "Delete Multiple Reminders",
      `Are you sure you want to delete ${selectedIds.size} reminder${selectedIds.size !== 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              for (const id of selectedIds) {
                await ExamRemindersService.deleteReminder(id);
              }
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedIds(new Set());
              loadReminders();
              Alert.alert("Success", `Deleted ${selectedIds.size} reminder${selectedIds.size !== 1 ? "s" : ""}`);
            } catch (error) {
              Alert.alert("Error", "Failed to delete reminders");
            }
          },
        },
      ]
    );
  };

  const handleBulkReschedule = () => {
    if (selectedIds.size === 0) return;

    Alert.prompt(
      "Reschedule Reminders",
      `Enter new test date for ${selectedIds.size} reminder${selectedIds.size !== 1 ? "s" : ""} (YYYY-MM-DD):`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reschedule",
          onPress: async (newDate: string | undefined) => {
            if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
              Alert.alert("Error", "Invalid date format. Please use YYYY-MM-DD");
              return;
            }

            try {
              for (const id of selectedIds) {
                const reminder = reminders.find((r) => r.id === id);
                if (reminder) {
                  await ExamRemindersService.updateReminder(id, {
                    ...reminder,
                    test_date: newDate,
                  });
                }
              }
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setSelectedIds(new Set());
              loadReminders();
              Alert.alert("Success", `Rescheduled ${selectedIds.size} reminder${selectedIds.size !== 1 ? "s" : ""}`);
            } catch (error) {
              Alert.alert("Error", "Failed to reschedule reminders");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const selectAll = () => {
    if (selectedIds.size === filteredReminders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReminders.map((r) => r.id)));
    }
  };

  const getFilteredReminders = () => {
    let filtered = reminders;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.passport_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.ticket_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      const now = new Date();
      filtered = filtered.filter((r) => {
        const testDate = new Date(r.test_date);
        const isExpired = testDate < now;
        const isScheduled = r.reminder_set;

        if (filterStatus === "expired") return isExpired;
        if (filterStatus === "scheduled") return isScheduled && !isExpired;
        if (filterStatus === "unscheduled") return !isScheduled && !isExpired;
        return true;
      });
    }

    return filtered;
  };

  const filteredReminders = getFilteredReminders();

  const ReminderCard = ({ reminder }: { reminder: ExamReminder }) => {
    const isSelected = selectedIds.has(reminder.id);

    return (
      <Pressable
        onPress={() => {
          if (selectedIds.size > 0) {
            toggleSelection(reminder.id);
          }
        }}
        onLongPress={() => toggleSelection(reminder.id)}
        style={({ pressed }) => [
          {
            backgroundColor: isSelected ? colors.primary + "20" : colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          {selectedIds.size > 0 && (
            <Pressable
              onPress={() => toggleSelection(reminder.id)}
              style={{ marginRight: 12, marginTop: 4 }}
            >
              <MaterialIcons
                name={isSelected ? "check-circle" : "radio-button-unchecked"}
                size={24}
                color={isSelected ? colors.primary : colors.muted}
              />
            </Pressable>
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
              {reminder.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
              Passport: {reminder.passport_no}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Test Date</Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                  {new Date(reminder.test_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted }}>Test Time</Text>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.foreground }}>
                  {reminder.test_time}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {reminder.occupation}
            </Text>
          </View>

          {selectedIds.size === 0 && (
            <Pressable
              onPress={() => handleDeleteReminder(reminder.id)}
              style={({ pressed }) => [
                {
                  padding: 8,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error || "#ef4444"} />
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
              Exam Reminders
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Upload Options */}
          <View style={{ gap: 10, marginBottom: 16 }}>
            <Pressable
              onPress={takePhoto}
              disabled={extracting}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: pressed || extracting ? 0.7 : 1,
                },
              ]}
            >
              {extracting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="camera-alt" size={20} color="white" />
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    Take Photo
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={pickImage}
              disabled={extracting}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: pressed || extracting ? 0.7 : 1,
                },
              ]}
            >
              {extracting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="image" size={20} color="white" />
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    Upload Image
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Filter Buttons */}
          <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
            {[
              { label: "All", status: "all" as const },
              { label: "Scheduled", status: "scheduled" as const },
              { label: "Unscheduled", status: "unscheduled" as const },
              { label: "Expired", status: "expired" as const },
            ].map(({ label, status }) => (
              <Pressable
                key={status}
                onPress={() => setFilterStatus(status)}
                style={({ pressed }) => [{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: filterStatus === status ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: filterStatus === status ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filterStatus === status ? "#fff" : colors.foreground,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                color: colors.foreground,
                fontSize: 14,
              }}
              onChangeText={setSearchQuery}
              placeholder="Search by name, passport..."
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 }}>
              {selectedIds.size} selected
            </Text>
            <Pressable
              onPress={selectAll}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: colors.primary + "20",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                {selectedIds.size === filteredReminders.length ? "Deselect All" : "Select All"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleBulkReschedule}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>Reschedule</Text>
            </Pressable>
            <Pressable
              onPress={handleBulkDelete}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: colors.error + "20",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.error }}>Delete</Text>
            </Pressable>
          </View>
        )}

        {/* Reminders List */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 20, flex: 1, paddingTop: 16 }}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredReminders.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
              <MaterialIcons name="document-scanner" size={48} color={colors.muted} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                No Reminders Yet
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                Upload or capture a test ticket to create your first reminder
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredReminders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ReminderCard reminder={item} />}
              scrollEnabled={false}
              ListHeaderComponent={
                <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
                  {filteredReminders.length} reminder{filteredReminders.length !== 1 ? "s" : ""}
                </Text>
              }
            />
          )}
        </View>
        </ScrollView>
      </ScreenContainer>
      <WebTabBar />
    </View>
  );
}
