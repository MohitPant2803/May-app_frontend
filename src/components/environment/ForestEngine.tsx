import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Group, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, useDerivedValue, useFrameCallback } from 'react-native-reanimated';
import { useStore } from '../../core/store';

import SkyGradient from './SkyGradient';
import CartoonForestLayers from './CartoonForestLayers';
import FogShader from './FogShader';
import WeatherSystem from './WeatherSystem';
import { EnvironmentMood, EnvironmentPalettes } from './ThemeData';

export default function ForestEngine() {
  const { width, height } = useWindowDimensions();
  const { isRecording } = useStore();
  
  // Cycling the 5 moods automatically to demonstrate the transitions!
  const [mood, setMood] = useState<EnvironmentMood>('morning');

  useEffect(() => {
    const interval = setInterval(() => {
      setMood(prev => {
        const moods: EnvironmentMood[] = ['morning', 'golden_morning', 'sunset', 'midnight', 'rainy'];
        return moods[(moods.indexOf(prev) + 1) % moods.length];
      });
    }, 300000); // Transitions automatically every 5 minutes (300000 ms)
    return () => clearInterval(interval);
  }, []);

  // Master color transition controller (drives all child components)
  const targetColors = useSharedValue(EnvironmentPalettes[mood]);
  const prevColors = useSharedValue(EnvironmentPalettes[mood]);
  const progress = useSharedValue(1);

  useEffect(() => {
    prevColors.value = targetColors.value;
    targetColors.value = EnvironmentPalettes[mood];
    progress.value = 0;
    progress.value = withTiming(1, { duration: 300000 }); // Seamless 5-minute morphing transition
  }, [mood]);
  
  // Master Time Controller drives all the living elements (trees, birds, ripples)
  const time = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    const dt = frameInfo.timeSincePreviousFrame || 16;
    // Cinematic Slow-Motion: the whole forest breathes slower when recording!
    time.value += dt * (isRecording ? 0.0004 : 0.0012);
  });

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isRecording ? 0.4 : 0, { duration: 1500 }),
  }));
  
  // Permanent soft warm glow (0.25) that intensifies (0.8) during interactions
  const glowOpacity = useDerivedValue(() => withTiming(isRecording ? 0.8 : 0.25, { duration: 1500 }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Group>
          {/* 1. Backing Sky Gradient */}
          <SkyGradient width={width} height={height} progress={progress} prevColors={prevColors} targetColors={targetColors} />
          
          {/* 2. Cozy Cartoon Forest Art */}
          <CartoonForestLayers width={width} height={height} progress={progress} prevColors={prevColors} targetColors={targetColors} time={time} />
          
          {/* 3. Soft Fog Base */}
          <FogShader width={width} height={height} progress={progress} prevColors={prevColors} targetColors={targetColors} />
          
          {/* 4. Weather (Rain / Fireflies) */}
          <WeatherSystem width={width} height={height} time={time} progress={progress} prevColors={prevColors} targetColors={targetColors} />

          {/* 5. Warm Focus Glow (Separates Chino from the cool background) */}
          <Group blendMode="screen">
            <Circle cx={width / 2} cy={height * 0.75} r={width * 0.65} opacity={glowOpacity}>
              <RadialGradient 
                c={vec(width / 2, height * 0.75)} r={width * 0.65} 
                colors={['#FFDFC2', 'transparent']} 
              />
            </Circle>
          </Group>
        </Group>
      </Canvas>

      {/* 6. Cinematic Dimming Overlay when Recording */}
      <Animated.View style={[styles.dimmerOverlay, animatedOverlayStyle, { backgroundColor: '#000' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  canvas: {
    flex: 1,
  },
  dimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Above background, below UI
  },
});
