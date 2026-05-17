import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { tokens } from '../../theme/tokens';

const WaveBar = ({ delay }: { delay: number }) => {
  const height = useSharedValue(10);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30 + Math.random() * 20, { duration: 400 + Math.random() * 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 400 + Math.random() * 200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

export default function RecordingWaveform() {
  return (
    <View style={styles.container}>
      {[0, 100, 200, 150, 50].map((delay, index) => (
        <WaveBar key={index} delay={delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.brand.warmGlow,
    shadowColor: tokens.colors.brand.warmGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});
