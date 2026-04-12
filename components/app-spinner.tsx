import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

/**
 * AppSpinner Component
 * 
 * A custom loading spinner with rotating animation.
 * Features:
 * - Smooth cubic-bezier animation (1.25s duration)
 * - Turquoise/teal color (#148287)
 * - Four rotating rings with staggered delays
 * - Fully responsive and centered
 */
export function AppSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1250,
        easing: Easing.bezier(0.5, 0, 0.5, 1),
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Animated.View style={animatedStyle}>
        <SpinnerRing delay={0} />
      </Animated.View>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
          },
        ]}
      >
        <SpinnerRing delay={-0.45} />
      </Animated.View>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
          },
        ]}
      >
        <SpinnerRing delay={-0.35} />
      </Animated.View>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
          },
        ]}
      >
        <SpinnerRing delay={-0.155} />
      </Animated.View>
    </View>
  );
}

/**
 * Individual spinner ring component
 */
function SpinnerRing({ delay }: { delay: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1250,
        easing: Easing.bezier(0.5, 0, 0.5, 1),
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * (1 + delay)}deg` }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 160,
          height: 160,
          borderWidth: 20,
          borderColor: 'transparent',
          borderTopColor: '#148287',
          borderRadius: 80,
        },
      ]}
    />
  );
}
