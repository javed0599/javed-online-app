import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatExamDate, getResultStatusColor, getResultStatusLabel } from "@/lib/api";
import { LaborResult } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePolling } from "@/lib/polling-provider";
import { StatusIcon } from "./status-icon";
import Svg, { Path, G, Rect } from "react-native-svg";

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

// Status color configuration
const STATUS_COLORS = {
  pending: {
    backgroundColor: "#fffaf0",
    lineColor: "#B54708",
    iconColor: "#B54708",
    textColor: "#B54708",
  },
  passed: {
    backgroundColor: "#ecfdf3",
    lineColor: "#067647",
    iconColor: "#067647",
    textColor: "#067647",
  },
  failed: {
    backgroundColor: "#fef3f2",
    lineColor: "#B42318",
    iconColor: "#B42318",
    textColor: "#B42318",
  },
};

// Pending Icon (Info)
const PendingIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <G>
      <Rect width="24" height="24" fill="transparent" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 13C11 13.5523 11.4477 14 12 14C12.5523 14 13 13.5523 13 13V8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8V13ZM13 15.9888C13 15.4365 12.5523 14.9888 12 14.9888C11.4477 14.9888 11 15.4365 11 15.9888V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V15.9888ZM7.25007 2.38782C8.54878 2.0992 10.1243 2 12 2C13.8757 2 15.4512 2.0992 16.7499 2.38782C18.06 2.67897 19.1488 3.176 19.9864 4.01358C20.824 4.85116 21.321 5.94002 21.6122 7.25007C21.9008 8.54878 22 10.1243 22 12C22 13.8757 21.9008 15.4512 21.6122 16.7499C21.321 18.06 20.824 19.1488 19.9864 19.9864C19.1488 20.824 18.06 21.321 16.7499 21.6122C15.4512 21.9008 13.8757 22 12 22C10.1243 22 8.54878 21.9008 7.25007 21.6122C5.94002 21.321 4.85116 20.824 4.01358 19.9864C3.176 19.1488 2.67897 18.06 2.38782 16.7499C2.0992 15.4512 2 13.8757 2 12C2 10.1243 2.0992 8.54878 2.38782 7.25007C2.67897 5.94002 3.176 4.85116 4.01358 4.01358C4.85116 3.176 5.94002 2.67897 7.25007 2.38782Z"
        fill={color}
      />
    </G>
  </Svg>
);

// Passed Icon (Checkmark)
const PassedIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22ZM16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z"
      fill={color}
    />
  </Svg>
);

// Failed Icon (X)
const FailedIcon = ({ color, size = 24 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.34426 1.01703C7.41336 0.674011 10.5861 0.674011 13.6552 1.01703C15.3679 1.20845 16.7497 2.55786 16.9508 4.27735C17.3178 7.41497 17.3178 10.5847 16.9508 13.7223C16.7497 15.4418 15.3679 16.7912 13.6552 16.9826C10.5861 17.3256 7.41336 17.3256 4.34426 16.9826C2.63153 16.7912 1.24978 15.4418 1.04867 13.7223C0.681694 10.5847 0.681694 7.41497 1.04867 4.27735C1.24978 2.55786 2.63154 1.20845 4.34426 1.01703ZM5.46943 5.46949C5.76232 5.17659 6.23719 5.17659 6.53009 5.46949L8.99976 7.93917L11.4694 5.4695C11.7623 5.1766 12.2372 5.1766 12.5301 5.4695C12.823 5.76239 12.823 6.23726 12.5301 6.53016L10.0604 8.99983L12.5301 11.4695C12.823 11.7624 12.823 12.2373 12.5301 12.5301C12.2372 12.823 11.7623 12.823 11.4694 12.5301L8.99976 10.0605L6.53009 12.5302C6.2372 12.823 5.76233 12.823 5.46943 12.5302C5.17654 12.2373 5.17654 11.7624 5.46943 11.4695L7.9391 8.99983L5.46943 6.53015C5.17653 6.23725 5.17653 5.76238 5.46943 5.46949Z"
      fill={color}
    />
  </Svg>
);

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

  // Get status configuration
  const status = displayResult.exam_result || "pending";
  const statusConfig = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;

  // Get status message
  const getStatusMessage = () => {
    if (status === "passed") return "The result is passed.";
    if (status === "failed") return "The result is failed.";
    return "The result is pending.";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (status === "passed") {
      return <PassedIcon color={statusConfig.iconColor} size={24} />;
    }
    if (status === "failed") {
      return <FailedIcon color={statusConfig.iconColor} size={24} />;
    }
    return <PendingIcon color={statusConfig.iconColor} size={24} />;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {/* Result Top - Status Section */}
      <View
        style={[
          styles.resultTop,
          {
            backgroundColor: statusConfig.backgroundColor,
            borderBottomColor: statusConfig.lineColor,
          },
        ]}
      >
        <View style={styles.statusContainer}>
          {isPolling ? (
            <ActivityIndicator size={24} color={statusConfig.iconColor} />
          ) : (
            getStatusIcon()
          )}
          <Text
            style={[
              styles.statusMessage,
              {
                color: statusConfig.textColor,
              },
            ]}
          >
            {getStatusMessage()}
          </Text>
        </View>
      </View>

      {/* Result Bottom - Test Details Section */}
      <View
        style={[
          styles.resultBottom,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.detailsHeader}>
          <Text
            style={[
              styles.detailsTitle,
              {
                color: colors.foreground,
              },
            ]}
          >
            Test Details
          </Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {applicantName && (
            <View style={styles.detailItem}>
              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: colors.muted,
                  },
                ]}
              >
                Applicant Name:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: colors.foreground,
                  },
                ]}
              >
                {applicantName}
              </Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailLabel,
                {
                  color: colors.muted,
                },
              ]}
            >
              Passport No.:
            </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: colors.foreground,
                },
              ]}
            >
              {passportNumber}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailLabel,
                {
                  color: colors.muted,
                },
              ]}
            >
              Occupation:
            </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: colors.foreground,
                },
              ]}
            >
              {occupationName || "Loading..."}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailLabel,
                {
                  color: colors.muted,
                },
              ]}
            >
              Test Date:
            </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: colors.foreground,
                },
              ]}
            >
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Auto-checking indicator */}
        {isPolling && (
          <View
            style={[
              styles.pollingIndicator,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="sync" size={14} color={colors.primary} />
              <Text
                style={[
                  styles.pollingText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Auto-checking every 5 min
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {(onUpdate || onDelete) && (
        <View
          style={[
            styles.actions,
            {
              borderTopColor: colors.border,
            },
          ]}
        >
          {onUpdate && (
            <Pressable
              onPress={onUpdate}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons name="update" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                Update
              </Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTop: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  resultBottom: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  detailsHeader: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailsGrid: {
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  pollingIndicator: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  pollingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
