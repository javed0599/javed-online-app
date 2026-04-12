import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { pollingAnalytics, type PollingStatistic } from "@/lib/polling-analytics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function PollingAnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [allStats, setAllStats] = useState<PollingStatistic[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      await pollingAnalytics.initialize();
      const stats = Object.values(pollingAnalytics.getAllStatistics());
      setAllStats(stats);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  const renderStatCard = (stat: PollingStatistic) => {
    const successRate = stat.totalChecks > 0 ? (stat.successfulChecks / stat.totalChecks) * 100 : 0;

    return (
      <View
        key={stat.entryId}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>
              Passport
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {stat.passportNumber}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.muted }}>
              Success Rate
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: successRate >= 80 ? colors.success : colors.warning,
              }}
            >
              {successRate.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Total Checks</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {stat.totalChecks}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Successful</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.success }}>
                {stat.successfulChecks}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Failed</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.error }}>
                {stat.failedChecks}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>
                Avg Response
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                {formatTime(stat.averageResponseTime)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Status Changes</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                {stat.statusChanges}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Peak Hour</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {stat.peakCheckHour !== null ? `${stat.peakCheckHour}:00` : "N/A"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>First Check</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                {formatDate(stat.firstCheckTime)}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>Last Check</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                {formatDate(stat.lastCheckTime)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground, flex: 1 }}>
            Polling Analytics
          </Text>
        </View>

        {/* Summary Stats */}
        {allStats.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 12 }}>
              Overall Statistics
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>
                  Total Entries
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                  {allStats.length}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>
                  Total Checks
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                  {allStats.reduce((sum, s) => sum + s.totalChecks, 0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "500", color: colors.muted }}>
                  Avg Success
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.success }}>
                  {(
                    (allStats.reduce((sum, s) => sum + s.successfulChecks, 0) /
                      allStats.reduce((sum, s) => sum + s.totalChecks, 0)) *
                    100
                  ).toFixed(0)}
                  %
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Analytics List */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : allStats.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
            <MaterialIcons name="analytics" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              No Analytics Yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Start polling to see analytics
            </Text>
          </View>
        ) : (
          <FlatList
            data={allStats}
            renderItem={({ item }) => renderStatCard(item)}
            keyExtractor={(item) => item.entryId}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
