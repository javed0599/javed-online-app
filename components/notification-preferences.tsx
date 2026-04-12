import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import {
  getNotificationPreferences,
  updateStatusSoundPreference,
  toggleGlobalNotifications,
  getSoundTypeLabel,
  type NotificationSoundType,
  type StatusType,
} from '@/lib/notification-preferences';
import * as Haptics from 'expo-haptics';

export function NotificationPreferences() {
  const colors = useColors();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSoundChange = async (status: StatusType, soundType: NotificationSoundType) => {
    try {
      await updateStatusSoundPreference(status, soundType);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadPreferences();
    } catch (error) {
      console.error('Failed to update preference:', error);
    }
  };

  const handleToggleGlobal = async (enabled: boolean) => {
    try {
      await toggleGlobalNotifications(enabled);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadPreferences();
    } catch (error) {
      console.error('Failed to toggle global notifications:', error);
    }
  };

  if (loading || !preferences) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: colors.muted }}>Loading preferences...</Text>
      </View>
    );
  }

  const soundOptions: NotificationSoundType[] = ['silent', 'vibration', 'sound-vibration'];
  const statuses: StatusType[] = ['passed', 'failed', 'pending'];

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 20 }}>
        {/* Global Toggle */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.muted,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            Global Settings
          </Text>

          <Pressable
            onPress={() => handleToggleGlobal(!preferences.globalEnabled)}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: preferences.globalEnabled ? colors.primary : colors.border,
                backgroundColor: preferences.globalEnabled ? `${colors.primary}15` : colors.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: preferences.globalEnabled ? colors.primary : colors.border,
                backgroundColor: preferences.globalEnabled ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {preferences.globalEnabled && (
                <MaterialIcons name="check" size={16} color={colors.background} />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                Enable Notifications
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                {preferences.globalEnabled ? 'All notifications enabled' : 'All notifications disabled'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Status-Specific Preferences */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.muted,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            Notification Sounds
          </Text>

          {statuses.map((status) => (
            <View key={status} style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.foreground,
                  marginBottom: 8,
                  textTransform: 'capitalize',
                }}
              >
                {status} Status
              </Text>

              <View style={{ gap: 8 }}>
                {soundOptions.map((soundType) => (
                  <Pressable
                    key={soundType}
                    onPress={() => handleStatusSoundChange(status, soundType)}
                    disabled={!preferences.globalEnabled}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor:
                          preferences[status] === soundType ? colors.primary : colors.border,
                        backgroundColor:
                          preferences[status] === soundType ? `${colors.primary}10` : colors.surface,
                        opacity: pressed && preferences.globalEnabled ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor:
                          preferences[status] === soundType ? colors.primary : colors.border,
                        backgroundColor:
                          preferences[status] === soundType ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {preferences[status] === soundType && (
                        <MaterialIcons name="check" size={12} color={colors.background} />
                      )}
                    </View>

                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: '500',
                        color: preferences.globalEnabled ? colors.foreground : colors.muted,
                      }}
                    >
                      {getSoundTypeLabel(soundType)}
                    </Text>

                    {soundType === 'silent' && (
                      <MaterialIcons name="volume-off" size={18} color={colors.muted} />
                    )}
                    {soundType === 'vibration' && (
                      <MaterialIcons name="vibration" size={18} color={colors.muted} />
                    )}
                    {soundType === 'sound-vibration' && (
                      <MaterialIcons name="volume-up" size={18} color={colors.muted} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: `${colors.primary}10`,
            borderRadius: 6,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, flex: 1 }}>
              Customize how you receive notifications for each status type
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
