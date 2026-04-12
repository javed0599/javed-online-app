import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { formatExamDate } from '@/lib/api';

export interface CheckHistory {
  id: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'pending';
  testCenter?: string;
  examDate?: string;
  previousStatus?: string;
}

interface CheckHistoryTimelineProps {
  history: CheckHistory[];
  isLoading?: boolean;
}

export function CheckHistoryTimeline({ history, isLoading }: CheckHistoryTimelineProps) {
  const colors = useColors();

  const getStatusColor = (status: string): string => {
    if (status === 'passed') return '#22c55e';
    if (status === 'failed') return '#ef4444';
    return '#f59e0b'; // pending
  };

  const getStatusIcon = (status: string) => {
    if (status === 'passed') return 'check-circle' as const;
    if (status === 'failed') return 'cancel' as const;
    return 'schedule' as const;
  };

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.muted }}>Loading check history...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <MaterialIcons name="history" size={48} color={colors.muted} style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
          No Check History
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
          Status checks will appear here as they are performed
        </Text>
      </View>
    );
  }

  // Group by date
  const groupedByDate = history.reduce(
    (acc, item) => {
      const date = formatDate(item.timestamp);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, CheckHistory[]>
  );

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 20 }}>
        {dates.map((date) => (
          <View key={date}>
            {/* Date Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <MaterialIcons name="calendar-today" size={16} color={colors.muted} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase' }}>
                {date}
              </Text>
            </View>

            {/* Timeline Items */}
            <View style={{ gap: 12 }}>
              {groupedByDate[date].map((item, index) => {
                const statusColor = getStatusColor(item.status);
                const statusIcon = getStatusIcon(item.status);
                const isLast = index === groupedByDate[date].length - 1;

                return (
                  <View key={item.id} style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Timeline Line and Dot */}
                    <View style={{ alignItems: 'center', gap: 0 }}>
                      {/* Dot */}
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: `${statusColor}20`,
                          borderWidth: 2,
                          borderColor: statusColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name={statusIcon as any} size={16} color={statusColor} />
                      </View>

                      {/* Line */}
                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            height: 40,
                            backgroundColor: colors.border,
                            marginTop: 0,
                          }}
                        />
                      )}
                    </View>

                    {/* Content */}
                    <View
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: colors.surface,
                        borderLeftWidth: 3,
                        borderLeftColor: statusColor,
                      }}
                    >
                      {/* Time and Status */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted }}>
                          {formatTime(item.timestamp)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: statusColor,
                            textTransform: 'capitalize',
                          }}
                        >
                          {item.status}
                        </Text>
                      </View>

                      {/* Status Change */}
                      {item.previousStatus && item.previousStatus !== item.status && (
                        <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>
                          {item.previousStatus} → {item.status}
                        </Text>
                      )}

                      {/* Test Center */}
                      {item.testCenter && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <MaterialIcons name="location-on" size={12} color={colors.muted} />
                          <Text style={{ fontSize: 11, color: colors.muted }}>{item.testCenter}</Text>
                        </View>
                      )}

                      {/* Exam Date */}
                      {item.examDate && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialIcons name="event" size={12} color={colors.muted} />
                          <Text style={{ fontSize: 11, color: colors.muted }}>
                            {formatExamDate(item.examDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
