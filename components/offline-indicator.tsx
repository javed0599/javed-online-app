import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface OfflineIndicatorProps {
  lastUpdateTime?: string;
  isCached?: boolean;
  isOffline?: boolean;
}

export function OfflineIndicator({ lastUpdateTime, isCached, isOffline }: OfflineIndicatorProps) {
  const colors = useColors();

  if (!isCached && !isOffline) {
    return null;
  }

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: isOffline ? `${colors.error}10` : `${colors.warning}10`,
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: isOffline ? colors.error : colors.warning,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialIcons
          name={isOffline ? 'wifi-off' : 'cloud-off'}
          size={16}
          color={isOffline ? colors.error : colors.warning}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: isOffline ? colors.error : colors.warning,
            }}
          >
            {isOffline ? 'Offline Mode' : 'Showing Cached Data'}
          </Text>
          {lastUpdateTime && (
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                marginTop: 2,
              }}
            >
              Last updated: {lastUpdateTime}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
