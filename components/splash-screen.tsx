import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppSpinner } from './app-spinner';

/**
 * SplashScreen Component
 * 
 * Displays a splash screen with custom loading spinner and app branding.
 * Features:
 * - Centered spinner with turquoise color
 * - App name and loading message
 * - Smooth fade-in animation
 * - Customizable duration
 */
export interface SplashScreenProps {
  /**
   * Duration in milliseconds to show the splash screen (default: 2000ms)
   */
  duration?: number;
  /**
   * Callback when splash screen should be hidden
   */
  onComplete?: () => void;
  /**
   * Whether to show the loading message (default: true)
   */
  showMessage?: boolean;
}

export function SplashScreen({
  duration = 2000,
  onComplete,
  showMessage = true,
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 flex-1 items-center justify-center bg-background z-50">
      <View className="flex-1 items-center justify-center w-full">
        <AppSpinner />
        
        {showMessage && (
          <View className="mt-12 items-center gap-2">
            <Text className="text-2xl font-bold text-foreground">
              JAVED ONLINE
            </Text>
            <Text className="text-sm text-muted">
              Loading exam results...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
