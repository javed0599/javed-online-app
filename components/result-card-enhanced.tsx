import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatExamDate, getResultStatusColor, getResultStatusLabel } from "@/lib/api";
import { LaborResult } from "@/lib/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface ResultCardEnhancedProps {
  result: LaborResult | null;
  passportNumber: string;
  onPress?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
  lastCheckedAt?: number | null;
  checkCount?: number;
}

export function ResultCardEnhanced({
  result,
  passportNumber,
  onPress,
  onDelete,
  onUpdate,
  lastCheckedAt,
  checkCount = 0,
}: ResultCardEnhancedProps) {
  const colors = useColors();

  if (!result) {
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
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.statusText, { color: colors.primary }]}>
              Loading...
            </Text>
          </View>
          <View style={styles.actions}>
            {onUpdate && (
              <Pressable
                onPress={onUpdate}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
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
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>
              Passport Number:
            </Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {passportNumber}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  const statusColor = getResultStatusColor(result.exam_result);
  const statusLabel = getResultStatusLabel(result.exam_result);
  const formattedDate = formatExamDate(result.exam_date);
  const isPending = result.exam_result === "pending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isPending ? colors.warning : colors.border,
          borderLeftWidth: isPending ? 4 : 1,
          borderLeftColor: isPending ? statusColor : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          {isPending ? (
            <>
              <ActivityIndicator size="small" color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons
                name={result.exam_result === "passed" ? "check-circle" : "cancel"}
                size={24}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </>
          )}
        </View>
        <View style={styles.actions}>
          {onUpdate && (
            <Pressable
              onPress={onUpdate}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <MaterialIcons name="refresh" size={20} color={colors.primary} />
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
            Test Center:
          </Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {result.test_center_name}
          </Text>
        </View>

        {lastCheckedAt && (
          <View style={[styles.row, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.muted }]}>
              Last Checked:
            </Text>
            <Text style={[styles.value, { color: colors.foreground, fontSize: 12 }]}>
              {new Date(lastCheckedAt).toLocaleTimeString()}
            </Text>
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
