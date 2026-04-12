import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatExamDate, getResultStatusColor, getResultStatusLabel } from "@/lib/api";
import { LaborResult } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusIcon } from "./status-icon";

interface ResultDetailCardProps {
  result: LaborResult;
  passportNumber: string;
  applicantName?: string;
  nationalityId?: string;
  occupationKey?: string;
  occupationName?: string;
  isPolling?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
  onSetReminder?: () => void;
  hasReminder?: boolean;
}

export function ResultDetailCard({
  result,
  passportNumber,
  applicantName,
  nationalityId,
  occupationKey,
  occupationName,
  isPolling,
  onUpdate,
  onDelete,
  onSetReminder,
  hasReminder,
}: ResultDetailCardProps) {
  const colors = useColors();
  const statusColor = getResultStatusColor(result.exam_result);
  const statusLabel = getResultStatusLabel(result.exam_result);
  const formattedDate = formatExamDate(result.exam_date);

  // Determine background color based on status
  const getBackgroundColor = () => {
    if (result.exam_result === "passed") return "#f0f9f6";
    if (result.exam_result === "failed") return "#fff5f5";
    return "#fffbeb"; // pending
  };

  // Determine status text color
  const getStatusTextColor = () => {
    if (result.exam_result === "passed") return "#000";
    if (result.exam_result === "failed") return "#e53e3e";
    return "#d97706"; // pending
  };

  const getStatusIconColor = () => {
    if (result.exam_result === "passed") return "#438e44";
    if (result.exam_result === "failed") return "#e53e3e";
    return "#d97706"; // pending
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      {/* Top Section - Status & Large Passport Display */}
      <View style={styles.topSection}>
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          {isPolling ? (
            <ActivityIndicator size={20} color={colors.primary} />
          ) : (
            <StatusIcon status={result.exam_result} size={20} />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color: getStatusTextColor(),
              },
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        {/* Passport Label */}
        <Text style={styles.passportLabel}>Passport Number:</Text>

        {/* Large Passport Number Display */}
        <Text style={styles.largePassportNumber}>{passportNumber}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Grid Section - Data Details */}
      <View style={styles.gridSection}>
        {/* Applicant Name - Full Width */}
        {applicantName && (
          <View style={styles.fullWidthItem}>
            <Text style={styles.gridLabel}>Applicant Name:</Text>
            <Text style={styles.gridValue}>{applicantName}</Text>
          </View>
        )}

        {/* Row 1: Passport Number & Exam Date */}
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Passport Number:</Text>
            <Text style={styles.gridValue}>{passportNumber}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Exam Date:</Text>
            <Text style={styles.gridValue}>{formattedDate}</Text>
          </View>
        </View>

        {/* Row 2: Nationality Code & Occupation Name/Key */}
        <View style={styles.gridRow}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Nationality Code:</Text>
            <Text style={styles.gridValue}>{nationalityId || "N/A"}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Occupation:</Text>
            <Text style={styles.gridValue}>{occupationName || "Loading..."}</Text>
          </View>
        </View>

        {/* Test Center - Full Width */}
        <View style={styles.fullWidthItem}>
          <Text style={styles.gridLabel}>Test Center:</Text>
          <Text style={styles.gridValue}>{result.test_center_name || "N/A"}</Text>
        </View>

        {/* Auto-checking indicator */}
        {isPolling && (
          <View style={styles.autoCheckingIndicator}>
            <MaterialIcons name="sync" size={14} color={colors.primary} />
            <Text style={[styles.gridLabel, { color: colors.primary }]}>
              Auto-checking every 5 min
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons removed - now positioned outside card in parent component */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topSection: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
  },
  passportLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5f7d8a",
    marginBottom: 4,
  },
  largePassportNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0ebee",
    marginHorizontal: 28,
  },
  gridSection: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  gridRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  gridItem: {
    flex: 1,
  },
  fullWidthItem: {
    marginBottom: 16,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5f7d8a",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e4d61",
  },
  autoCheckingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0ebee",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 28,
    paddingBottom: 20,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
  },
});
