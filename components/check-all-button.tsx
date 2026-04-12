import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface CheckAllButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function CheckAllButton({ onPress, disabled = false }: CheckAllButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const colors = useColors();

  const handlePress = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onPress();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading || disabled}
      style={({ pressed }) => [
        {
          backgroundColor: colors.primary,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View className="flex-row items-center justify-center gap-2">
        {isLoading ? (
          <>
            <ActivityIndicator color={colors.background} size="small" />
            <Text className="text-foreground font-semibold">Checking All...</Text>
          </>
        ) : (
          <>
            <Text className="text-2xl">🔄</Text>
            <Text className="text-foreground font-semibold">Check All Entries</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
