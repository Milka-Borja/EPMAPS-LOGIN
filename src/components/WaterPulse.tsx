import { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface WaterPulseProps {
  size?: 'small' | 'large';
}

export function WaterPulse({ size = 'large' }: WaterPulseProps) {
  const pulse = useSharedValue(0);
  const drift = useSharedValue(0);
  const isSmall = size === 'small';

  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1800 }), -1, true));
    drift.set(withRepeat(withTiming(1, { duration: 2600 }), -1, true));

    return () => {
      cancelAnimation(pulse);
      cancelAnimation(drift);
    };
  }, [drift, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + pulse.value * 0.68,
    transform: [{ scale: 0.72 + pulse.value * 0.48 }],
  }));
  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -8 + drift.value * 16 },
      { rotate: `${-18 + drift.value * 36}deg` },
    ],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      className={`relative items-center justify-center ${
        isSmall ? 'h-12 w-12' : 'h-32 w-32'
      }`}
      importantForAccessibility="no"
    >
      <View className="absolute h-full w-full rounded-full border border-cyan-200/20" />
      <Animated.View
        className={`absolute rounded-full border border-cyan-200/50 ${
          isSmall ? 'h-10 w-10' : 'h-28 w-28'
        }`}
        style={pulseStyle}
      />
      <Animated.View
        className={`absolute rounded-full bg-cyan-300/10 ${
          isSmall ? 'h-8 w-8' : 'h-24 w-24'
        }`}
        style={pulseStyle}
      />
      <View
        className={`items-center justify-center rounded-full border border-white/15 bg-navy-700 ${
          isSmall ? 'h-7 w-7' : 'h-16 w-16'
        }`}
      >
        <Feather
          color="#8DE9E7"
          name="droplet"
          size={isSmall ? 15 : 34}
          strokeWidth={1.8}
        />
      </View>
      <Animated.View
        className={`absolute rounded-full border-2 border-navy-900 bg-[#F0A45D] ${
          isSmall ? 'right-1 top-1 h-2.5 w-2.5' : 'right-3 top-3 h-4 w-4'
        }`}
        style={driftStyle}
      />
    </Animated.View>
  );
}
