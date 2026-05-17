import React from 'react';
import { Group, Circle, Oval, vec, BlurMask } from '@shopify/react-native-skia';
import { useDerivedValue, interpolateColor, interpolate, SharedValue } from 'react-native-reanimated';
import { ThemeColors } from './ThemeData';

interface LayerProps {
  width: number;
  height: number;
  progress: SharedValue<number>;
  prevColors: SharedValue<ThemeColors>;
  targetColors: SharedValue<ThemeColors>;
  time: SharedValue<number>;
}

export default function CartoonForestLayers({ width, height, progress, prevColors, targetColors, time }: LayerProps) {
  const bgTrees = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.bgTrees, targetColors.value.bgTrees]));
  const lake = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.lake, targetColors.value.lake]));
  const midTrees = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.midTrees, targetColors.value.midTrees]));
  const grass = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.grass, targetColors.value.grass]));
  
  const windSpeed = useDerivedValue(() => interpolate(progress.value, [0, 1], [prevColors.value.windSpeed, targetColors.value.windSpeed]));

  // Swaying math (creates a slow, calming breathing movement)
  const bgSway = useDerivedValue(() => Math.sin(time.value * 0.8) * 0.03 * windSpeed.value);
  const midSway1 = useDerivedValue(() => Math.sin(time.value * 1.2) * 0.05 * windSpeed.value);
  const midSway2 = useDerivedValue(() => Math.cos(time.value * 1.0) * 0.04 * windSpeed.value);
  const grassSway = useDerivedValue(() => Math.sin(time.value * 1.5) * 0.015 * windSpeed.value);

  // Lake Ripples expanding gently over time
  const ripple1W = useDerivedValue(() => width * 0.3 + ((time.value * 0.3) % 1) * width * 0.25);
  const ripple1O = useDerivedValue(() => (1 - ((time.value * 0.3) % 1)) * 0.25);
  
  const ripple2W = useDerivedValue(() => width * 0.4 + (((time.value * 0.3) + 0.5) % 1) * width * 0.3);
  const ripple2O = useDerivedValue(() => (1 - (((time.value * 0.3) + 0.5) % 1)) * 0.15);

  return (
    <Group>
      {/* Celestial Bodies (Moon & Twinkling Stars) */}
      <CelestialBodies width={width} height={height} progress={progress} prevColors={prevColors} targetColors={targetColors} time={time} />

      {/* Distant Birds flying in V formations */}
      <Birds width={width} height={height} time={time} progress={progress} prevColors={prevColors} targetColors={targetColors} />

      {/* Distant Forest Silhouettes (Swaying around their bases) */}
      <Group transform={useDerivedValue(() => [{ rotate: bgSway.value }])} origin={vec(width * 0.15, height * 0.58 + width * 0.45)}>
        <Circle cx={width * 0.15} cy={height * 0.58} r={width * 0.45} color={bgTrees}>
          <BlurMask blur={8} style="normal" />
        </Circle>
      </Group>
      <Group transform={useDerivedValue(() => [{ rotate: bgSway.value * -0.8 }])} origin={vec(width * 0.5, height * 0.62 + width * 0.3)}>
        <Circle cx={width * 0.5} cy={height * 0.62} r={width * 0.3} color={bgTrees}>
          <BlurMask blur={6} style="normal" />
        </Circle>
      </Group>
      <Group transform={useDerivedValue(() => [{ rotate: bgSway.value * 1.2 }])} origin={vec(width * 0.85, height * 0.58 + width * 0.45)}>
        <Circle cx={width * 0.85} cy={height * 0.58} r={width * 0.45} color={bgTrees}>
          <BlurMask blur={8} style="normal" />
        </Circle>
      </Group>

      {/* Calm Lake */}
      <Oval x={-width * 0.2} y={height * 0.65} width={width * 1.4} height={height * 0.25} color={lake} />
      
      {/* Subtle Lake Ripples overlapping */}
      <Group color={bgTrees} blendMode="overlay">
        <Oval x={useDerivedValue(() => width / 2 - ripple1W.value / 2)} y={height * 0.68} width={ripple1W} height={height * 0.005} opacity={ripple1O} />
        <Oval x={useDerivedValue(() => width / 2 - ripple2W.value / 2)} y={height * 0.74} width={ripple2W} height={height * 0.008} opacity={ripple2O} />
      </Group>

      {/* Midground Trees with Layered Leaves */}
      <Group transform={useDerivedValue(() => [{ rotate: midSway1.value }])} origin={vec(-width * 0.1, height * 0.72 + width * 0.4)}>
        <Circle cx={-width * 0.1} cy={height * 0.72} r={width * 0.4} color={midTrees} />
        <Circle cx={width * 0.05} cy={height * 0.65} r={width * 0.25} color={midTrees} opacity={0.8} />
      </Group>

      <Group transform={useDerivedValue(() => [{ rotate: midSway2.value }])} origin={vec(width * 1.1, height * 0.72 + width * 0.4)}>
        <Circle cx={width * 1.1} cy={height * 0.72} r={width * 0.4} color={midTrees} />
        <Circle cx={width * 0.95} cy={height * 0.68} r={width * 0.2} color={midTrees} opacity={0.8} />
      </Group>

      {/* Soft Grass Stage for Chino (Foreground) */}
      <Group transform={useDerivedValue(() => [{ rotate: grassSway.value }])} origin={vec(width * 0.5, height)}>
        <Oval x={-width * 0.5} y={height * 0.8} width={width * 2} height={height * 0.3} color={grass} />
        <Oval x={-width * 0.2} y={height * 0.85} width={width * 1.4} height={height * 0.3} color={midTrees} opacity={0.3} />
      </Group>
      
      {/* Magical Hanging Lanterns */}
      <Lantern cx={width * 0.12} cy={height * 0.58} sway={midSway1} time={time} progress={progress} prevColors={prevColors} targetColors={targetColors} />
      <Lantern cx={width * 0.88} cy={height * 0.62} sway={midSway2} time={time} progress={progress} prevColors={prevColors} targetColors={targetColors} />
    </Group>
  );
}

function CelestialBodies({ width, height, progress, prevColors, targetColors, time }: any) {
  const starOpacity = useDerivedValue(() => interpolate(progress.value, [0, 1], [prevColors.value.starOpacity, targetColors.value.starOpacity]));
  const moonOpacity = useDerivedValue(() => interpolate(progress.value, [0, 1], [prevColors.value.moonOpacity, targetColors.value.moonOpacity]));
  
  const moonGlow = useDerivedValue(() => 0.5 + Math.sin(time.value * 2) * 0.3);

  return (
    <Group>
      <Group opacity={starOpacity}>
        <Circle cx={width * 0.2} cy={height * 0.12} r={1.5} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 3) * 0.6)} />
        <Circle cx={width * 0.45} cy={height * 0.2} r={1.2} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 2 + 1) * 0.6)} />
        <Circle cx={width * 0.8} cy={height * 0.08} r={2} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 4 + 2) * 0.6)} />
        <Circle cx={width * 0.3} cy={height * 0.28} r={1.5} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 2.5 + 3) * 0.6)} />
        <Circle cx={width * 0.6} cy={height * 0.1} r={1} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 3.5 + 4) * 0.6)} />
        <Circle cx={width * 0.9} cy={height * 0.35} r={1.5} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 2.8 + 5) * 0.6)} />
        <Circle cx={width * 0.15} cy={height * 0.35} r={1} color="#FFF" opacity={useDerivedValue(() => 0.4 + Math.sin(time.value * 3.2 + 6) * 0.6)} />
      </Group>

      <Group opacity={moonOpacity}>
        <Circle cx={width * 0.75} cy={height * 0.18} r={35} color="#AFCBFF" opacity={useDerivedValue(() => moonGlow.value * 0.4)}>
          <BlurMask blur={20} style="normal" />
        </Circle>
        <Circle cx={width * 0.75} cy={height * 0.18} r={20} color="#F6EBD8" />
        <Circle cx={width * 0.75 - 6} cy={height * 0.18 - 4} r={3.5} color="#D9D7F1" opacity={0.6} />
        <Circle cx={width * 0.75 + 8} cy={height * 0.18 + 2} r={5} color="#D9D7F1" opacity={0.6} />
        <Circle cx={width * 0.75 - 2} cy={height * 0.18 + 8} r={2.5} color="#D9D7F1" opacity={0.6} />
      </Group>
    </Group>
  );
}

function Birds({ width, height, time, progress, prevColors, targetColors }: any) {
  const birdDensity = useDerivedValue(() => interpolate(progress.value, [0, 1], [prevColors.value.birdDensity, targetColors.value.birdDensity]));
  const birdColor = useDerivedValue(() => interpolateColor(progress.value, [0, 1], [prevColors.value.bgTrees, targetColors.value.bgTrees]));
  
  return (
    <Group color={birdColor} opacity={useDerivedValue(() => Math.min(1, birdDensity.value))}>
      <Bird xStart={width * 1.2} yStart={height * 0.3} speed={-0.2} scale={0.5} time={time} width={width} offset={0} />
      <Bird xStart={width * 1.5} yStart={height * 0.25} speed={-0.15} scale={0.3} time={time} width={width} offset={100} />
      <Bird xStart={-width * 0.2} yStart={height * 0.35} speed={0.25} scale={0.6} time={time} width={width} offset={200} />
    </Group>
  );
}

function Bird({ xStart, yStart, speed, scale, time, width, offset }: any) {
  const cx = useDerivedValue(() => {
    const rawX = xStart + time.value * 40 * speed;
    const totalW = width * 2;
    return ((rawX % totalW) + totalW) % totalW - width * 0.5;
  });
  const cy = useDerivedValue(() => yStart + Math.sin(time.value * 1.5 + offset) * 15);
  const flap = useDerivedValue(() => Math.sin(time.value * 15 + offset) * 5);

  return (
    <Group transform={useDerivedValue(() => [{ translateX: cx.value }, { translateY: cy.value }, { scale }])}>
      <Oval x={8} y={4} width={8} height={4} />
      <Oval x={2} y={useDerivedValue(() => 2 + flap.value)} width={8} height={4} />
      <Oval x={14} y={useDerivedValue(() => 2 + flap.value)} width={8} height={4} />
    </Group>
  );
}

function Lantern({ cx, cy, sway, time, progress, prevColors, targetColors }: any) {
  const lanternAlpha = useDerivedValue(() => {
    const isNight = interpolate(progress.value, [0, 1], [prevColors.value.fogOpacity, targetColors.value.fogOpacity]);
    return isNight > 0.4 ? 0.8 : 0.15; // Soft glow during day, bright during night
  });
  const flicker = useDerivedValue(() => 0.8 + Math.sin(time.value * 5) * 0.2);

  return (
    <Group transform={useDerivedValue(() => [{ rotate: sway.value * 2 }])} origin={vec(cx, cy - 30)}>
      <Oval x={cx - 1} y={cy - 30} width={2} height={30} color="#111" opacity={0.5} />
      <Oval x={cx - 5} y={cy} width={10} height={14} color="#FFD166" opacity={lanternAlpha} />
      <Circle cx={cx} cy={cy + 7} r={useDerivedValue(() => 25 * flicker.value)} color="#FFD166" opacity={useDerivedValue(() => lanternAlpha.value * 0.3)} />
    </Group>
  );
}