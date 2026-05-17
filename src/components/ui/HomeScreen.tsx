import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, FadeInDown, Easing } from 'react-native-reanimated';
import ForestEngine from '../environment/ForestEngine';
import NimoCanvas from '../animations/NimoCanvas';
import TopBar from './TopBar';
import GlassPanel from './GlassPanel';
import { useSessionStore } from '../../core/sessionStore';
import { useRouter, usePathname } from 'expo-router';
import FloatingDialogue from './FloatingDialogue';
import MemoryJournalOverlay from './MemoryJournalOverlay';
import EnvironmentSettingsOverlay from './EnvironmentSettingsOverlay';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [isInteractable, setIsInteractable] = useState(true);
  const uiOpacity = useSharedValue(1);
  const uiTranslateY = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStatus = useSessionStore((state) => state.status);
  const activeOverlay = useSessionStore((state) => state.activeOverlay);
  const theme = useSessionStore((state) => state.theme);
  const router = useRouter();
  const pathname = usePathname();
  const isReflection = pathname === '/session/reflection';
  const isIntroComplete = useSessionStore((state) => state.isIntroComplete);
  const worldScale = useSharedValue(1.0);
  const worldOpacity = useSharedValue(0);
  const hasRevealedRef = useRef(false);

  const resetTimer = () => {
    if (!useSessionStore.getState().isIntroComplete) return;
    setIsInteractable(true);
    uiOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    uiTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) });

    // Clear existing timer and start a new 10 second countdown
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Do not start the fade-out timer if we are in an active session
    if (useSessionStore.getState().status !== 'idle') return;

    timerRef.current = setTimeout(() => {
      uiOpacity.value = withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) });
      uiTranslateY.value = withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.ease) });
      setTimeout(() => setIsInteractable(false), 2500);
    }, 12000);
  };

  useEffect(() => {
    if (!isIntroComplete) {
      uiOpacity.value = 0;
      worldOpacity.value = 0;
      uiTranslateY.value = 40; // Push down further for deeper emergence
      worldScale.value = 1.08; // Deep zoom
      setIsInteractable(false);
      return;
    }

    if (activeOverlay !== 'none' || isReflection) {
      // Hide TopBar completely when overlay is active or reflection modal is open
      if (timerRef.current) clearTimeout(timerRef.current);
      uiOpacity.value = withTiming(0, { duration: 400 });
      uiTranslateY.value = withTiming(-20, { duration: 400 });
      setIsInteractable(false);
    } else {
      if (!hasRevealedRef.current) {
        hasRevealedRef.current = true;
        
        // 1. Fast fade-in from black and camera settle (all in 1 second)
        worldOpacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });
        worldScale.value = withTiming(1.0, { duration: 1000, easing: Easing.out(Easing.cubic) });

        // 2. Quick UI Emergence
        uiTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) });
        uiOpacity.value = withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) });

        // 3. Interaction Enable + Haptic Signal
        setTimeout(() => {
          setIsInteractable(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);

        // 4. Start auto-hide idle timer
        timerRef.current = setTimeout(() => {
          if (useSessionStore.getState().status !== 'idle') return;
          uiOpacity.value = withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) });
          uiTranslateY.value = withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.ease) });
          setTimeout(() => setIsInteractable(false), 2500);
        }, 15000);
      } else {
        // Standard restore
        uiTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) });
        if (sessionStatus === 'idle') {
          resetTimer();
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          setIsInteractable(true);
          uiOpacity.value = withTiming(1, { duration: 400 });
        }
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionStatus, activeOverlay, isReflection, isIntroComplete]);

  const worldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: worldScale.value }],
    opacity: worldOpacity.value
  }));

  useEffect(() => {
    if (sessionStatus === 'cooldown') {
      const t = setTimeout(() => {
        router.push('/session/reflection');
      }, 3500); // Wait 3.5s for emotional cooldown transition
      return () => clearTimeout(t);
    }
  }, [sessionStatus]);

  const uiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
    transform: [{ translateY: uiTranslateY.value }],
  }));

  // Map the architectural session status to Nimo's procedural physical emotion
  let nimoEmotion: any = 'idle';
  switch (sessionStatus) {
    case 'listening': nimoEmotion = 'listening'; break;
    case 'paused': nimoEmotion = 'paused'; break; 
    case 'thinking': nimoEmotion = 'thinking'; break; 
    case 'speaking': nimoEmotion = 'speaking'; break;
    case 'cooldown': nimoEmotion = 'cooldown'; break;
    default: nimoEmotion = 'idle'; break;
  }

  // Animated Background Style for the deepest container
  const bgAnimatedStyle = useAnimatedStyle(() => {
     let targetColor = '#000000';
     switch(theme) {
        case 'Lavender Calm': targetColor = '#1A1525'; break;
        case 'Midnight Focus': targetColor = '#030712'; break;
        case 'Rainy Evening': targetColor = '#0F172A'; break;
        case 'Warm Sunset': targetColor = '#2D1510'; break;
        case 'Forest Silence': targetColor = '#062E1A'; break;
     }
     return { backgroundColor: withTiming(targetColor, { duration: 1500 }) };
  }, [theme]);

  // Atmospheric Tint Overlay to beautifully shift the 3D Forest environment
  const tintAnimatedStyle = useAnimatedStyle(() => {
     let targetColor = 'rgba(5, 10, 16, 0.4)';
     switch(theme) {
        case 'Lavender Calm': targetColor = 'rgba(130, 110, 160, 0.25)'; break;
        case 'Midnight Focus': targetColor = 'rgba(3, 7, 18, 0.65)'; break;
        case 'Rainy Evening': targetColor = 'rgba(30, 41, 59, 0.55)'; break;
        case 'Warm Sunset': targetColor = 'rgba(234, 88, 12, 0.25)'; break;
        case 'Forest Silence': targetColor = 'rgba(6, 78, 59, 0.45)'; break;
     }
     return { backgroundColor: withTiming(targetColor, { duration: 1500 }) };
  }, [theme]);

  return (
    <Animated.View style={[styles.container, bgAnimatedStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, worldAnimatedStyle]} pointerEvents="box-none">
        {/* 1. Deepest Layer: 3D Forest Environment */}
        <ForestEngine />

        {/* Dynamic Tint Overlay to affect ForestEngine based on Mood */}
        <Animated.View style={[StyleSheet.absoluteFill, tintAnimatedStyle]} pointerEvents="none" />

        {/* 2. Mid Layer: 3D Scene with Nimo */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <NimoCanvas emotion={nimoEmotion} theme={theme} onBackgroundTap={resetTimer} />
        </View>
      </Animated.View>

      {/* Floating Dialogue System */}
      <FloatingDialogue />

      {/* Transparent UI Overlays */}
      {activeOverlay === 'timeline' && <MemoryJournalOverlay />}
      {activeOverlay === 'profile' && <EnvironmentSettingsOverlay />}

      {/* 3. Interaction Layer: Glassmorphism UI at the top */}
      <Animated.View 
        style={[styles.uiLayer, uiAnimatedStyle]} 
        pointerEvents={isInteractable ? 'box-none' : 'none'}
        onTouchStart={resetTimer} // Tapping the UI also resets the timer
      >
        <TopBar />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  uiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10, elevation: 100 },
});