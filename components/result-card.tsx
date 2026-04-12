import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatExamDate, getResultStatusColor, getResultStatusLabel } from "@/lib/api";
import { LaborResult } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePolling } from "@/lib/polling-provider";
import { StatusIcon } from "./status-icon";

interface ResultCardProps {
  result: LaborResult;
  passportNumber: string;
  applicantName?: string;
  occupationCode?: string;
  occupationName?: string;
  entryId?: string;
  onPress?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function ResultCard({
  result,
  passportNumber,
  applicantName,
  occupationCode,
  occupationName,
  entryId,
  onPress,
  onDelete,
  onUpdate,
}: ResultCardProps) {
  const colors = useColors();
  const { getPollingEntry } = usePolling();
  const pollingEntry = entryId ? getPollingEntry(entryId) : undefined;
  
  // Use polling result if available, otherwise use provided result
  const displayResult = pollingEntry?.lastResult || result;
  const statusLabel = getResultStatusLabel(displayResult.exam_result);
  const formattedDate = formatExamDate(displayResult.exam_date);
  const isPolling = pollingEntry?.isPolling;
  
  // Get status text color (consistent with detail card)
  const getStatusTextColor = () => {
    if (displayResult.exam_result === "passed") return "#000";
    if (displayResult.exam_result === "failed") return "#e53e3e";
    return "#d97706"; // pending
  };
  const statusColor = getStatusTextColor();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          {isPolling ? (
            <ActivityIndicator size={24} color={colors.primary} />
          ) : (
            <StatusIcon status={displayResult.exam_result} size={24} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        <View style={styles.actions}>
          {onUpdate && (
            <Pressable
              onPress={onUpdate}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, { marginLeft: 12 }]}
            >
              <MaterialIcons name="update" size={20} color={colors.primary} />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }, { marginLeft: 12 }]}
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {applicantName && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>
              Applicant Name:
            </Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {applicantName}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Passport Number:
          </Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {passportNumber}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Exam Date:
          </Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {formattedDate}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Occupation:
          </Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {occupationName || 'Loading...'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Test Center:
          </Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {displayResult.test_center_name}
          </Text>
        </View>
        
        {isPolling && (
          <View style={[styles.row, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="sync" size={14} color={colors.primary} />
              <Text style={[styles.label, { color: colors.primary }]}>
                Auto-checking every 5 min
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
