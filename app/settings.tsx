import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { WebTabBar } from '@/components/web-tab-bar';
import { NotificationPreferences } from '@/components/notification-preferences';
import { getCacheSizeInfo, clearAllCache, formatCacheTimestamp } from '@/lib/offline-cache';
import { getQueueStats } from '@/lib/retry-queue';
import * as Haptics from 'expo-haptics';

type SettingsTab = 'general' | 'notifications' | 'cache' | 'about';

export default function SettingsScreen() {
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const cache = await getCacheSizeInfo();
      const queue = await getQueueStats();
      setCacheInfo(cache);
      setQueueStats(queue);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };



  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear all cached results?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            await clearAllCache();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await loadStats();
          } catch (error) {
            console.error('Failed to clear cache:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderGeneralTab = () => (
    <View style={{ gap: 16 }}>
      {/* App Info */}
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
          App Information
        </Text>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 16,
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>App Name</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>JAVED ONLINE</Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Version</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>1.0.0</Text>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>Build</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
              {new Date().getFullYear()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCacheTab = () => (
    <View style={{ gap: 16 }}>
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
          Cache Statistics
        </Text>

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 16,
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="storage" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.muted }}>Cached Entries</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
              {cacheInfo?.count || 0}
            </Text>
          </View>

          {cacheInfo?.newestTimestamp && (
            <>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="access-time" size={18} color={colors.primary} />
                  <Text style={{ fontSize: 14, color: colors.muted }}>Last Updated</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  {formatCacheTimestamp(cacheInfo.newestTimestamp)}
                </Text>
              </View>
            </>
          )}

          {queueStats && (
            <>
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="sync" size={18} color={colors.warning} />
                  <Text style={{ fontSize: 14, color: colors.muted }}>Pending Retries</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  {queueStats.total}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      <Pressable
        onPress={handleClearCache}
        style={({ pressed }) => [
          {
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: `${colors.error}15`,
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: colors.error,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <MaterialIcons name="delete" size={18} color={colors.error} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.error }}>Clear All Cache</Text>
      </Pressable>

      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: `${colors.warning}10`,
          borderRadius: 6,
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="info" size={16} color={colors.warning} />
          <Text style={{ fontSize: 12, color: colors.warning, flex: 1 }}>
            Clearing cache will remove all offline data. You can still access results by checking online.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAboutTab = () => (
    <View style={{ gap: 16 }}>
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
          Features
        </Text>

        <View style={{ gap: 8 }}>
          {[
            { icon: 'check-circle', title: 'Real-time Status Checks', desc: 'Check results every 5 minutes' },
            { icon: 'notifications', title: 'Smart Notifications', desc: 'Telegram & phone notifications' },
            { icon: 'cloud-off', title: 'Offline Access', desc: 'View cached results offline' },
            { icon: 'history', title: 'Check History', desc: 'Complete timeline of all checks' },
          ].map((feature, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: colors.surface,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name={feature.icon as any} size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                  {feature.title}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

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
          About
        </Text>

        <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
          JAVED ONLINE helps you check Saudi labor exam results in real-time with automatic status updates,
          Telegram notifications, and offline access to your check history.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer className="p-4" edges={["top", "left", "right", "bottom"]}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
          Settings
        </Text>

        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['general', 'notifications', 'cache', 'about'] as SettingsTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: activeTab === tab ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: activeTab === tab ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: activeTab === tab ? colors.background : colors.foreground,
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'notifications' && <NotificationPreferences />}
        {activeTab === 'cache' && renderCacheTab()}
        {activeTab === 'about' && renderAboutTab()}
      </ScrollView>
      </ScreenContainer>
      <WebTabBar />
    </View>
  );
}
