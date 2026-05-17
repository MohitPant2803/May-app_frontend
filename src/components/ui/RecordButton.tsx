import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withSpring
} from 'react-native-reanimated';
import { Mic } from 'lucide-react-native';
import GlassPanel from './GlassPanel';
import RecordingWaveform from '../animations/RecordingWaveform';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '../../core/sessionStore';

export default function RecordButton() {
  const status = useSessionStore((state) => state.status);
  const startListening = useSessionStore((state) => state.startListening);
  const stopListening = useSessionStore((state) => state.stopListening);
  const pauseListening = useSessionStore((state) => state.pauseListening);
  
  // Ambient breathing scale
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4); // Always maintain a subtle ambient glow

  useEffect(() => {
    if (status === 'idle' || status === 'speaking' || status === 'thinking' || status === 'cooldown') {
      // Gentle breathing animation while idle
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withTiming(0.4, { duration: 1000 });
    } else if (status === 'paused') {
      // Calm suspended state while giving the user time to think
      scale.value = withSpring(1.02, { damping: 15, stiffness: 80 });
      glowOpacity.value = withTiming(0.6, { duration: 1000 });
    } else {
      // Expand softly when recording starts
      scale.value = withSpring(1.15, { damping: 12, stiffness: 90 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Outer Halo - Dreamy Lavender */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.outerHalo, glowStyle]} />
      {/* Inner Glow - Soft Mint/Blue */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.innerGlow, glowStyle]} />
      
      <Animated.View style={animatedStyle}>
        <Pressable onPress={() => {
          if (status === 'idle' || status === 'paused' || status === 'speaking') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startListening();
            useSessionStore.setState({ dialogueText: '' });
          } else if (status === 'listening') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            // Tapping center button while listening gracefully pauses the interaction
            pauseListening();
            
            const isQuestion = Math.random() < 0.3;
            const encouragements = [
              "Take your time.",
              "I'm listening.",
              "Think slowly.",
              "You're explaining better now."
            ];
            const questions = [
              "Wait... why does recursion return here?",
              "I think I almost understood stacks.",
              "Can you explain this part once more?"
            ];
            
            const dialogue = isQuestion 
              ? questions[Math.floor(Math.random() * questions.length)]
              : encouragements[Math.floor(Math.random() * encouragements.length)];
              
            useSessionStore.setState({ dialogueText: dialogue });
          }
        }}>
          <GlassPanel style={styles.button}>
            {status === 'listening' ? (
              <RecordingWaveform />
            ) : (
              <Mic size={32} color={status === 'paused' ? '#B5D8EB' : '#5C6B73'} strokeWidth={1.5} />
            )}
          </GlassPanel>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  button: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  outerHalo: { 
    backgroundColor: '#E6E6FA', // Lavender
    borderRadius: 999, 
    transform: [{ scale: 1.2 }], 
    shadowColor: '#E6E6FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  innerGlow: {
    backgroundColor: '#E0FBFC', // Pale blue
    borderRadius: 999, 
    transform: [{ scale: 1.1 }], 
    shadowColor: '#E0FBFC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15,
  },
});