import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Circle, Group, BlurMask } from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback, useDerivedValue, interpolateColor, interpolate, SharedValue } from 'react-native-reanimated';
import { ThemeColors } from './ThemeData';

const NUM_PARTICLES = 40;

interface WeatherProps {
  width: number;
  height: number;
  time: SharedValue<number>;
  progress: SharedValue<number>;
  prevColors: SharedValue<ThemeColors>;
  targetColors: SharedValue<ThemeColors>;
}

export default function WeatherSystem({ width, height, time, progress, prevColors, targetColors }: WeatherProps) {

  // Generate static random offsets for particles
  const particles = useMemo(() => {
    return Array.from({ length: NUM_PARTICLES }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speedY: Math.random() * 0.4 + 0.1,
      speedX: Math.random() * 0.4 - 0.2,
      size: Math.random() * 2 + 1.5,
      opacityOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 2 + 1,
    }));
  }, [width, height]);

  return (
    <Group>
      {particles.map((p, i) => {
        return (
          <AnimatedParticle key={i} particle={p} time={time} height={height} width={width} progress={progress} prevColors={prevColors} targetColors={targetColors} />
        );
      })}
    </Group>
  );
}

function AnimatedParticle({ particle, time, height, width, progress, prevColors, targetColors }: any) {
  const cx = useDerivedValue(() => {
    const isRain = interpolate(progress.value, [0, 1], [prevColors.value.isRain, targetColors.value.isRain]);
    const windSpeed = interpolate(progress.value, [0, 1], [prevColors.value.windSpeed, targetColors.value.windSpeed]);
    
    // Wobble heavily for pollen/fireflies, fly straight for rain
    const wobble = isRain < 0.5 ? Math.sin(time.value * particle.wobbleSpeed + particle.opacityOffset) * 15 : 0;
    const windX = (isRain > 0.5 ? 0.5 : particle.speedX) * windSpeed;
    const rawX = particle.x + (time.value * 50 * windX) + wobble;
    
    return ((rawX % width) + width) % width;
  });
  
  const cy = useDerivedValue(() => {
    const isRain = interpolate(progress.value, [0, 1], [prevColors.value.isRain, targetColors.value.isRain]);
    const direction = isRain > 0.5 ? 1 : -1;
    const speedMult = isRain > 0.5 ? 15 : 1; // Rain is much faster
    
    const rawY = particle.y + (time.value * 40 * particle.speedY * direction * speedMult);
    return ((rawY % height) + height) % height; 
  });

  const opacity = useDerivedValue(() => {
    const isRain = interpolate(progress.value, [0, 1], [prevColors.value.isRain, targetColors.value.isRain]);
    // Rain is constant opacity, fireflies/pollen pulse slowly
    return isRain > 0.5 ? 0.4 : (Math.sin(time.value * 2 + particle.opacityOffset) + 1) / 2 * 0.7;
  });
  
  const color = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.particle, targetColors.value.particle]));

  return (
    <Circle cx={cx} cy={cy} r={particle.size} color={color} opacity={opacity}>
      <BlurMask blur={useDerivedValue(() => particle.size)} style="normal" />
    </Circle>
  );
}
