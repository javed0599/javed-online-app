import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { batchCheckService, BatchCheckProgress } from '@/lib/batch-check-service';
import * as Haptics from 'expo-haptics';

interface BatchCheckUIProps {
  visible: boolean;
  onClose?: () => void;
}

export function BatchCheckUI({ visible, onClose }: BatchCheckUIProps) {
  const colors = useColors();
  const [progress, setProgress] = useState<BatchCheckProgress>(batchCheckService.getProgress());
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const unsubscribe = batchCheckService.onProgress(setProgress);
    return unsubscribe;
  }, []);

  useEffect(() => {
    progressWidth.value = withTiming(progress.percentage, { duration: 300 });
  }, [progress.percentage, progressWidth]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!visible) {
    return null;
  }

  const isCompleted = progress.status === 'completed';
  const isFailed = progress.failed > 0;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <MaterialIcons
          name={isCompleted ? 'check-circle' : 'hourglass-empty'}
          size={24}
          color={isCompleted ? colors.success : colors.primary}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginLeft: 12,
            flex: 1,
          }}
        >
          {progress.status === 'checking' ? 'Checking Results...' : 'Check Complete'}
        </Text>
        {isCompleted && onClose && (
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Progress Info */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {progress.completed} of {progress.total} checked
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
            {progress.percentage}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 8,
            backgroundColor: colors.border,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                height: '100%',
                backgroundColor: colors.primary,
                borderRadius: 4,
              },
              animatedProgressStyle,
            ]}
          />
        </View>
      </View>

      {/* Current Item */}
      {progress.currentPassport && (
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
            marginBottom: 12,
            fontStyle: 'italic',
          }}
        >
          Current: {progress.currentPassport}
        </Text>
      )}

      {/* Stats */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          backgroundColor: colors.background,
          borderRadius: 8,
          padding: 12,
        }}
      >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
            Completed
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.success }}>
            {progress.completed}
          </Text>
        </View>

        {progress.failed > 0 && (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              Failed
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.error }}>
              {progress.failed}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
            Remaining
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
            {progress.total - progress.completed}
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {isFailed && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: colors.error,
            borderRadius: 8,
            padding: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <MaterialIcons name="warning" size={16} color={colors.background} />
          <Text
            style={{
              fontSize: 12,
              color: colors.background,
              marginLeft: 8,
              flex: 1,
            }}
          >
            {progress.failed} check{progress.failed > 1 ? 's' : ''} failed. Will retry automatically.
          </Text>
        </View>
      )}
    </View>
  );
}
