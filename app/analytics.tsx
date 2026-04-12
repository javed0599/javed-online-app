import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useData } from '@/lib/data-provider';
import { analyticsService } from '@/lib/analytics-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PassportEntry } from '@/lib/types';

export default function AnalyticsScreen() {
  const colors = useColors();
  const { entries } = useData();

  const stats = useMemo(() => {
    return analyticsService.calculateStats(entries);
  }, [entries]);

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: colors.foreground,
              marginBottom: 4,
            }}
          >
            Analytics
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            Overall statistics and insights
          </Text>
        </View>

        {/* Overall Stats */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Overall Statistics
          </Text>

          <View style={{ gap: 12 }}>
            {/* Total Entries */}
            <StatCard
              icon="folder-open"
              label="Total Entries"
              value={stats.totalEntries.toString()}
              color={colors.primary}
            />

            {/* Total Checks */}
            <StatCard
              icon="check-circle"
              label="Total Checks"
              value={stats.totalChecks.toString()}
              color={colors.primary}
            />

            {/* Pass Rate */}
            <StatCard
              icon="trending-up"
              label="Pass Rate"
              value={`${stats.passRate}%`}
              color={colors.success}
            />

            {/* Check Frequency */}
            <StatCard
              icon="schedule"
              label="Avg Checks per Entry"
              value={stats.checkFrequency.toFixed(1)}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Status Breakdown
          </Text>

          <View style={{ gap: 8 }}>
            <StatusBreakdownItem
              label="Passed"
              count={stats.passedCount}
              color={colors.success}
            />
            <StatusBreakdownItem
              label="Failed"
              count={stats.failedCount}
              color={colors.error}
            />
            <StatusBreakdownItem
              label="Pending"
              count={stats.pendingCount}
              color={colors.warning}
            />
          </View>
        </View>

        {/* Entry Details */}
        {entries.length > 0 && (
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              Entry Details
            </Text>

            <View style={{ gap: 12 }}>
              {entries.map((entry: PassportEntry) => {
                const entryAnalytics = analyticsService.calculateEntryAnalytics(entry);
                const timeline = analyticsService.getStatusTimeline(entry);
                return (
                  <View
                    key={entry.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {/* Passport Number */}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.foreground,
                        marginBottom: 8,
                      }}
                    >
                      {entry.passport_number}
                    </Text>

                    {/* Stats Row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          Total Checks
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.primary,
                          }}
                        >
                          {entryAnalytics.totalChecks}
                        </Text>
                      </View>

                      <View>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          Status Changes
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: colors.primary,
                          }}
                        >
                          {entryAnalytics.statusChanges}
                        </Text>
                      </View>

                      <View>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          Current Status
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color:
                              entryAnalytics.currentStatus === 'passed'
                                ? colors.success
                                : entryAnalytics.currentStatus === 'failed'
                                  ? colors.error
                                  : colors.warning,
                          }}
                        >
                          {entryAnalytics.currentStatus.charAt(0).toUpperCase() +
                            entryAnalytics.currentStatus.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline */}
                    {timeline.length > 0 && (
                      <View
                        style={{
                          backgroundColor: colors.background,
                          borderRadius: 8,
                          padding: 8,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.muted,
                            marginBottom: 6,
                          }}
                        >
                          Status Timeline
                        </Text>
                        {timeline.slice(-3).map((item, idx) => (
                          <View
                            key={idx}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: idx < timeline.length - 1 ? 4 : 0,
                            }}
                          >
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor:
                                  item.status === 'passed'
                                    ? colors.success
                                    : item.status === 'failed'
                                      ? colors.error
                                      : colors.warning,
                                marginRight: 8,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                color: colors.muted,
                                flex: 1,
                              }}
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)} on{' '}
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {entries.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <MaterialIcons name="analytics" size={48} color={colors.muted} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginTop: 12,
              }}
            >
              No Data Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              Add entries and check results to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: `${color}20`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

interface StatusBreakdownItemProps {
  label: string;
  count: number;
  color: string;
}

function StatusBreakdownItem({ label, count, color }: StatusBreakdownItemProps) {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: color,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          marginRight: 12,
        }}
      />
      <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: color,
        }}
      >
        {count}
      </Text>
    </View>
  );
}
