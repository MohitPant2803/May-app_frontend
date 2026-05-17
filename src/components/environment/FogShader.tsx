import React from 'react';
import { Group, Rect, LinearGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue, interpolateColor, interpolate, SharedValue } from 'react-native-reanimated';
import { ThemeColors } from './ThemeData';

interface FogProps {
  width: number;
  height: number;
  progress: SharedValue<number>;
  prevColors: SharedValue<ThemeColors>;
  targetColors: SharedValue<ThemeColors>;
}

export default function FogShader({ width, height, progress, prevColors, targetColors }: FogProps) {
  // Fog softly inherits the lowest sky color to perfectly blend the horizon
  const fogColors = useDerivedValue(() => {
    return ['transparent', interpolateColor(progress.value, [0, 1], [prevColors.value.skyBot, targetColors.value.skyBot])];
  });
  
  const fogOpacity = useDerivedValue(() => interpolate(progress.value, [0, 1], [prevColors.value.fogOpacity, targetColors.value.fogOpacity]));

  return (
    <Group blendMode="screen" opacity={fogOpacity}>
      {/* Replaced heavy fractal noise with a clean, cinematic gradient rising from the bottom */}
      <Rect x={0} y={height * 0.4} width={width} height={height * 0.6}>
        <LinearGradient
          start={vec(width / 2, height * 0.4)}
          end={vec(width / 2, height * 0.8)}
          colors={fogColors}
        />
      </Rect>
    </Group>
  );
}
