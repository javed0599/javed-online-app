import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useData } from "@/lib/data-provider";
import { usePolling } from "@/lib/polling-provider";
import { ReferralNoteModal } from "@/components/referral-note-modal";
import { BackgroundCheckSettings } from "@/components/background-check-settings";
import { PollingStatusIndicator } from "@/components/polling-status-indicator";

import { PollingCountdown } from "@/components/polling-countdown";
import { AutoCheckIndicator } from "@/components/auto-check-indicator";
import { ResultDetailCard } from "@/components/result-detail-card";
import { StatusIcon } from "@/components/status-icon";
import { SuccessToast } from "@/components/success-toast";
import { fetchLaborResult, formatExamDate, getResultStatusColor, getResultStatusLabel } from "@/lib/api";
import { LaborResult } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { scheduleExamReminder, cancelExamReminder, hasExamReminder } from "@/lib/notification-service";

export default function ResultDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams();
  const { getEntryById, addCheckHistory, addReferralNote, deleteReferralNote, deleteEntry } =
    useData();

  const entryId = params.entryId as string;
  const entry = getEntryById(entryId);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5 * 60 * 1000);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const { startPollingEntry, stopPollingEntry, getPollingEntry } = usePolling();
  const pollingEntry = getPollingEntry(entryId);

  if (!entry) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <Text style={{ color: colors.foreground }}>Entry not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const result = await fetchLaborResult({
        passport_number: entry.passport_number,
        occupation_key: entry.occupation_key,
        nationality_id: entry.nationality_id,
      });

      if (result) {
        const status = result.exam_result as "passed" | "failed" | "pending";
        await addCheckHistory(entryId, result, status);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        setShowSuccessToast(true);
      }
    } catch (error) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
      Alert.alert("Error", "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (note: string) => {
    await addReferralNote(entryId, note);
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  };

  const handleStartPolling = () => {
    if (!entry) return;
    startPollingEntry(
      entryId,
      entry.passport_number,
      entry.occupation_key,
      entry.nationality_id,
      pollingInterval
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStopPolling = () => {
    stopPollingEntry(entryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const lastResultRef = useRef<LaborResult | null>(null);

  useEffect(() => {
    if (pollingEntry?.lastResult && lastResultRef.current !== pollingEntry.lastResult) {
      lastResultRef.current = pollingEntry.lastResult;
      const status = pollingEntry.lastResult.exam_result as "passed" | "failed" | "pending";
      addCheckHistory(entryId, pollingEntry.lastResult, status);
    }
  }, [pollingEntry?.lastResult, entryId, addCheckHistory]);

  useEffect(() => {
    const checkReminder = async () => {
      const has = await hasExamReminder(entryId);
      setHasReminder(has);
    };
    checkReminder();
  }, [entryId]);

  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          await deleteReferralNote(entryId, noteId);
        },
        style: "destructive",
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete the entry for ${entry.passport_number}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            await deleteEntry(entryId);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            router.back();
          },
          style: "destructive",
        },
      ]
    );
  };

  const result = entry.latest_result;
  const lastCheckTime = entry.last_checked_at
    ? new Date(entry.last_checked_at).toLocaleString()
    : "Never";

  const handleSetReminder = async () => {
    if (!entry || !result) return;

    setReminderLoading(true);
    try {
      if (hasReminder) {
        await cancelExamReminder(entryId);
        setHasReminder(false);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        const notificationId = await scheduleExamReminder(
          entryId,
          result.exam_date,
          entry.applicant_name,
          result.test_center_name
        );
        if (notificationId) {
          setHasReminder(true);
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        } else {
          Alert.alert("Error", "Failed to schedule reminder");
        }
      }
    } catch (error) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
      Alert.alert("Error", "Failed to manage reminder");
    } finally {
      setReminderLoading(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colors.primary}
            />
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.foreground,
              marginLeft: 12,
              flex: 1,
            }}
          >
            Result Details
          </Text>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20, flex: 1 }}>
          {result ? (
            <>
              {/* Result Detail Card */}
              <ResultDetailCard
                result={result}
                passportNumber={entry.passport_number}
                applicantName={entry.applicant_name}
                nationalityId={entry.nationality_id}
                occupationKey={entry.occupation_key}
                occupationName={entry.occupation_name}
                isPolling={pollingEntry?.isPolling}
                onDelete={handleDelete}
              />

              {/* Action Buttons - Below Card */}
              <View style={{ gap: 12, marginBottom: 20, flexDirection: "row" }}>
                <Pressable
                  onPress={!pollingEntry?.isPolling ? handleStartPolling : handleStopPolling}
                  style={({ pressed }) => [{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    borderColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    {pollingEntry?.isPolling ? "STOP AUTO CHECK" : "AUTO CHECK"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleUpdate}
                  disabled={loading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: colors.primary,
                      borderWidth: 2,
                      borderColor: colors.primary,
                      paddingVertical: 12,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed || loading ? 0.7 : 1,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Update status
                    </Text>
                  )}
                </Pressable>
              </View>



              {/* Auto-Check Indicator */}
              {pollingEntry?.isPolling && (
                <AutoCheckIndicator
                  isActive={pollingEntry.isPolling}
                  lastCheckTime={pollingEntry.lastResult ? Date.now() : null}
                  nextCheckTime={pollingEntry.lastResult ? Date.now() + pollingInterval : null}
                />
              )}

              {/* Polling Status */}
              {pollingEntry && (
                <View style={{ marginBottom: 20 }}>
                  <PollingStatusIndicator
                    status={pollingEntry.status}
                    lastFetchTime={pollingEntry.lastResult ? Date.now() : null}
                    retryCount={0}
                    error={pollingEntry.lastError?.message}
                  />
                  <PollingCountdown
                    isPolling={pollingEntry.isPolling}
                    intervalMs={pollingInterval}
                    lastFetchTime={pollingEntry.lastResult ? Date.now() : null}
                  />
                </View>
              )}



              {showBackgroundSettings && (
                <View style={{ marginBottom: 20 }}>
                  <BackgroundCheckSettings
                    entryId={entryId}
                    passportNumber={entry.passport_number}
                  />
                </View>
              )}

              {/* Spacer to push bottom content down */}
              <View style={{ flex: 1 }} />

              {/* Bottom Section - Referral Notes, Last Checked, Total Checks */}
              <View style={{ gap: 20 }}>
                {/* History Info */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 8,
                  }}
                >
                  <DetailRow
                    label="Last Checked"
                    value={lastCheckTime}
                    colors={colors}
                  />
                  <DetailRow
                    label="Total Checks"
                    value={entry.check_count.toString()}
                    colors={colors}
                  />
                </View>

                {/* Referral Notes */}
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.foreground,
                      }}
                    >
                      Referral Notes ({entry.referral_notes?.length || 0})
                    </Text>
                    <Pressable
                      onPress={() => setShowNoteModal(true)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    >
                      <MaterialIcons name="add-circle" size={28} color={colors.primary} />
                    </Pressable>
                  </View>

                  {entry.referral_notes && entry.referral_notes.length > 0 ? (
                    entry.referral_notes.map((note) => (
                      <View
                        key={note.id}
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 14,
                            flex: 1,
                          }}
                        >
                          {note.content}
                        </Text>
                        <Pressable
                          onPress={() => handleDeleteNote(note.id)}
                          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                        >
                          <MaterialIcons name="delete" size={20} color={colors.error} />
                        </Pressable>
                      </View>
                    ))
                  ) : (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 14,
                        fontStyle: "italic",
                      }}
                    >
                      No referral notes yet
                    </Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <Text style={{ color: colors.foreground }}>No result data available</Text>
          )}
        </View>
      </ScrollView>

      {/* Referral Note Modal */}
      <ReferralNoteModal
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleAddNote}
      />

      {/* Success Toast */}
      <SuccessToast
        visible={showSuccessToast}
        message="Status updated successfully"
        duration={1000}
        onHide={() => setShowSuccessToast(false)}
      />
    </ScreenContainer>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
}

function DetailRow({ label, value, colors }: DetailRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );
}
