import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface PressableButtonProps {
  accessibilityHint?: string;
  accessibilityLabel: string;
  children: ReactNode;
  className: string;
  disabled?: boolean;
  onPress: PressableProps['onPress'];
}

export function PressableButton({
  accessibilityHint,
  accessibilityLabel,
  children,
  className,
  disabled = false,
  onPress,
}: PressableButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!disabled) {
          scale.set(withSpring(0.96));
        }
      }}
      onPressOut={() => scale.set(withSpring(1))}
    >
      <Animated.View
        className={`${className}${disabled ? ' opacity-60' : ''}`}
        style={animatedStyle}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
