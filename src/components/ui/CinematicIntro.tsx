import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// A dreamy floating particle system
const Particle = ({ index }: { index: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(Math.random() * 0.5 + 0.5);

  useEffect(() => {
    const delay = Math.random() * 2000;
    const duration = 4000 + Math.random() * 3000;

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(Math.random() * 0.6 + 0.2, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      )
    );

    translateY.value = withDelay(delay, withTiming(-100 - Math.random() * 100, { duration }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const left = `${Math.random() * 100}%`;
  const bottom = `${Math.random() * 30 + 10}%`;

  return <Animated.View style={[styles.particle, style, { left, bottom }]} />;
};

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const bgOpacity = useSharedValue(1);
  const blurOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  const [text, setText] = useState("");

  useEffect(() => {
    const messages = [
      "Let's understand this together.",
      "Teach me something today.",
      "I'm listening."
    ];
    setText(messages[Math.floor(Math.random() * messages.length)]);

    // SCENE 1 - Darkness & Breathing Light (0 - 1.5s)
    glowOpacity.value = withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) });
    glowScale.value = withTiming(1.4, { duration: 5000, easing: Easing.out(Easing.ease) });

    // SCENE 2 - May Appears (1.5 - 3.5s)
    // Fade the solid background slightly to reveal the heavily blurred 3D world and silhouette
    bgOpacity.value = withDelay(1500, withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }));

    // SCENE 3 - The World Opens (3.5 - 5.5s)
    // Clear the blur and dark overlay entirely
    blurOpacity.value = withDelay(3500, withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }));
    bgOpacity.value = withDelay(3500, withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) }));
    glowOpacity.value = withDelay(3500, withTiming(0, { duration: 2000 }));

    // Text appears as a floating thought above her
    textOpacity.value = withDelay(3800, withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(3800, withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }));

    // SCENE 4 - UI Emergence (5.5 - 7s)
    textOpacity.value = withDelay(6000, withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }));

    // Final Moment - Unmount the intro overlay right as everything clears to let HomeScreen glide its UI upwards
    setTimeout(() => {
      onComplete();
    }, 7200); 
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const blurStyle = useAnimatedStyle(() => ({ opacity: blurOpacity.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Depth Layer 1: Frosted Blur over the 3D canvas */}
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Depth Layer 2: Deep Lavender Fog Background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.darkBg, bgStyle]} />

      {/* Depth Layer 3: Ambient Breathing Glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Depth Layer 4: Cinematic Floating Dust/Fog Particles */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </View>

      {/* Depth Layer 5: Floating Thought Text */}
      <View style={styles.textContainer}>
        <Animated.Text style={[styles.text, textStyle]}>{text}</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  darkBg: { backgroundColor: '#0A0610' },
  
  // Creates a volumetric spotlight illusion
  glow: { position: 'absolute', width: 350, height: 350, borderRadius: 175, backgroundColor: '#2A1B38', top: '35%', shadowColor: '#826EA0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 80, elevation: 20 },
  
  textContainer: { position: 'absolute', bottom: '40%', width: '100%', alignItems: 'center' },
  text: { color: '#F8FAFC', fontSize: 17, fontWeight: '400', fontStyle: 'italic', letterSpacing: 0.8, textShadowColor: 'rgba(255,255,255,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  
  particle: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#E6E6FA', shadowColor: '#E6E6FA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 },
});