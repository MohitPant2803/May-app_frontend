import React from 'react';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, interpolateColor, SharedValue } from 'react-native-reanimated';
import { ThemeColors } from './ThemeData';

interface SkyProps {
  width: number;
  height: number;
  progress: SharedValue<number>;
  prevColors: SharedValue<ThemeColors>;
  targetColors: SharedValue<ThemeColors>;
}

export default function SkyGradient({ width, height, progress, prevColors, targetColors }: SkyProps) {

  const colors = useDerivedValue(() => {
    return [
      interpolateColor(progress.value, [0, 1], [prevColors.value.skyTop, targetColors.value.skyTop]),
      interpolateColor(progress.value, [0, 1], [prevColors.value.skyMid, targetColors.value.skyMid]),
      interpolateColor(progress.value, [0, 1], [prevColors.value.skyBot, targetColors.value.skyBot]),
    ];
  });

  return (
    <Rect x={0} y={0} width={width} height={height}>
      <LinearGradient
        start={vec(width / 2, 0)}
        end={vec(width / 2, height)}
        colors={colors}
      />
    </Rect>
  );
}
