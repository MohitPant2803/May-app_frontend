import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
  withRepeat,
  withSpring
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '../../core/sessionStore';

const { width, height } = Dimensions.get('window');

// ============================================================================
// AMBIENT ENVIRONMENT COMPONENTS
// ============================================================================

const Pollen = React.memo(({ index }: { index: number }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(Math.random() * 0.5 + 0.5);
  
  const [left] = useState(`${Math.random() * 100}%`);
  const [bottom] = useState(`${Math.random() * 100}%`);

  useEffect(() => {
    const delay = Math.random() * 2000;

    // Smooth, slow opacity breathing
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(Math.random() * 0.4 + 0.2, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Continuous slow upward drift
    translateY.value = withDelay(delay, withTiming(-200 - Math.random() * 150, { duration: 15000, easing: Easing.out(Easing.sin) }));
    
    // Gentle horizontal swaying
    translateX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(25, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-25, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) })
      ), -1, true));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { scale: scale.value }],
  }));

  return <Animated.View style={[styles.pollen, style, { left, bottom }]} pointerEvents="none" />;
});

const Cloud = React.memo(({ top, delay, speed, scale, opacity }: any) => {
  const translateX = useSharedValue(-300);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(width + 300, { duration: speed, easing: Easing.linear }));
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(12, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-12, { duration: 6000, easing: Easing.inOut(Easing.sin) })
      ), -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale }],
    opacity
  }));

  return <Animated.View style={[styles.cloud, { top }, style]} pointerEvents="none" />;
});

// ============================================================================
// BIRD COMPONENT
// ============================================================================

const Bird = React.memo(({ top, delay, duration, scale }: any) => {
  const translateX = useSharedValue(-50);
  const translateY = useSharedValue(0);
  const wingY = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(width + 100, { duration, easing: Easing.linear }));
    translateY.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.sin) }), 
        withTiming(15, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ), -1, true
    ));
    wingY.value = withRepeat(
      withSequence(withTiming(4, { duration: 300, easing: Easing.inOut(Easing.ease) }), withTiming(-4, { duration: 300, easing: Easing.inOut(Easing.ease) })), -1, true
    );
  }, []);

  const birdStyle = useAnimatedStyle(() => ({ position: 'absolute', top, transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale }] }));
  const wingStyle = useAnimatedStyle(() => ({ transform: [{ translateY: wingY.value }] }));

  return (
    <Animated.View style={birdStyle}>
      <Animated.View style={wingStyle}>
        <View style={styles.birdWingLeft} />
        <View style={styles.birdWingRight} />
      </Animated.View>
    </Animated.View>
  );
});

// ============================================================================
// MAIN MASCOT COMPONENT
// ============================================================================

const LittleLamb = () => {
  const breathing = useSharedValue(1);
  const earRotation = useSharedValue(0);
  const eyeScaleY = useSharedValue(1);
  const tailRotation = useSharedValue(0);
  const walkAnim = useSharedValue(0);
  const headRot = useSharedValue(0);
  const mouthOpen = useSharedValue(0);
  const bodyBounce = useSharedValue(0);

  useEffect(() => {
    // Soft, calming breathing rhythm
    breathing.value = withRepeat(withSequence(withTiming(1.02, { duration: 2500, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) })), -1, true);
    
    // Curious tiny ear twitches
    earRotation.value = withRepeat(withSequence(withDelay(4000, withTiming(-12, { duration: 600, easing: Easing.out(Easing.ease) })), withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })), -1, true);
    
    // Cute double blinks
    eyeScaleY.value = withRepeat(
      withSequence(
        withDelay(3000 + Math.random() * 2000, withTiming(0.1, { duration: 120 })),
        withTiming(1, { duration: 120 }),
        withDelay(150, withTiming(0.1, { duration: 120 })),
        withTiming(1, { duration: 120 })
      ), -1, false
    );

    // Walk Animation Sync (1000ms to 4750ms)
    walkAnim.value = withDelay(1000, 
      withSequence(
        withRepeat(withSequence(withTiming(1, { duration: 250 }), withTiming(-1, { duration: 250 })), 7, false),
        withTiming(0, { duration: 250 })
      )
    );
    
    bodyBounce.value = withDelay(1000,
      withSequence(
        withRepeat(withSequence(withTiming(-6, { duration: 125 }), withTiming(0, { duration: 125 })), 15, false),
        withTiming(0, { duration: 125 })
      )
    );

    // Excited tail wag while walking
    tailRotation.value = withDelay(1000,
      withSequence(
        withRepeat(withSequence(withTiming(15, { duration: 150 }), withTiming(-15, { duration: 150 })), 12, false),
        withTiming(0, { duration: 150 })
      )
    );

    // Idle Wag resumes after walk
    setTimeout(() => {
      tailRotation.value = withRepeat(withSequence(withTiming(8, { duration: 400 }), withTiming(-8, { duration: 400 })), -1, true);
    }, 4800);

    // Shake head playfully when stopping
    headRot.value = withDelay(4800, withSequence(withTiming(-15, { duration: 150, easing: Easing.inOut(Easing.ease) }), withTiming(15, { duration: 300, easing: Easing.inOut(Easing.ease) }), withTiming(-8, { duration: 200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) })));

    // Open mouth to speak 
    mouthOpen.value = withDelay(5100, withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }));

  }, []);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathing.value }] }));
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bodyBounce.value }] }));
  const headStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${headRot.value}deg` }] }));
  const leg1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${walkAnim.value * 25}deg` }] }));
  const leg2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${walkAnim.value * -25}deg` }] }));
  const leg3Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${walkAnim.value * 25}deg` }] }));
  const leg4Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${walkAnim.value * -25}deg` }] }));
  const earLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-25 + earRotation.value}deg` }] }));
  const earRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${25 - earRotation.value}deg` }] }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: eyeScaleY.value }] }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tailRotation.value}deg` }] }));
  const mouthStyle = useAnimatedStyle(() => ({ opacity: mouthOpen.value, transform: [{ scale: mouthOpen.value }] }));
  const smileStyle = useAnimatedStyle(() => ({ opacity: 1 - mouthOpen.value }));

  return (
    <Animated.View style={[styles.lambContainer, bodyStyle]}>
      <View style={styles.lambShadow} />
      
      <Animated.View style={bounceStyle}>
        <Animated.View style={[styles.lambTail, tailStyle]} />

        <View style={styles.lambBody}>
          <View style={styles.lambFluff1} />
          <View style={styles.lambFluff2} />
        </View>
        
        <Animated.View style={[styles.lambHead, headStyle]}>
          <Animated.View style={[styles.lambEarLeft, earLeftStyle]} />
          <Animated.View style={[styles.lambEarRight, earRightStyle]} />
          <Animated.View style={[styles.lambEyeLeft, eyeStyle]} />
          <Animated.View style={[styles.lambEyeRight, eyeStyle]} />
          <View style={styles.lambBlushLeft} />
          <View style={styles.lambBlushRight} />
          <Animated.View style={[styles.lambSmile, smileStyle]} />
          <Animated.View style={[styles.lambMouthOpen, mouthStyle]} />
        </Animated.View>

        <Animated.View style={[styles.lambLeg1, leg1Style]} />
        <Animated.View style={[styles.lambLeg2, leg2Style]} />
        <Animated.View style={[styles.lambLeg3, leg3Style]} />
        <Animated.View style={[styles.lambLeg4, leg4Style]} />
      </Animated.View>
    </Animated.View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const masterOpacity = useSharedValue(0);
  const posterScale = useSharedValue(1.08); // Initial slight zoom for continuous cinematic effect
  
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);
  const textScale = useSharedValue(0.95);
  
  const lambTranslateX = useSharedValue(width); // Start off-screen right
  
  const hillsTranslateY = useSharedValue(40);
  const hillBackScale = useSharedValue(1);
  const hillMidScale = useSharedValue(1);
  const hillFrontScale = useSharedValue(1);

  // Ambient animations
  const skyBlushOpacity = useSharedValue(0.35);
  const sunPulse = useSharedValue(1);
  const skyColor = useSharedValue('#A8C8E8');
  const blackOutOpacity = useSharedValue(0);

  useEffect(() => {
    // Ambient environmental loops
    skyBlushOpacity.value = withRepeat(withSequence(withTiming(0.65, { duration: 8000, easing: Easing.inOut(Easing.sin) }), withTiming(0.35, { duration: 8000, easing: Easing.inOut(Easing.sin) })), -1, true);
    sunPulse.value = withRepeat(withSequence(withTiming(1.04, { duration: 6000, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) })), -1, true);

    // Initial poster reveal - deeply cinematic and slow
    masterOpacity.value = withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) });
    posterScale.value = withTiming(1, { duration: 15000, easing: Easing.out(Easing.cubic) });
    
    // Slow drifting environments
    hillsTranslateY.value = withTiming(0, { duration: 3000, easing: Easing.out(Easing.cubic) });
    hillBackScale.value = withTiming(1.06, { duration: 15000, easing: Easing.out(Easing.sin) });
    hillMidScale.value = withTiming(1.04, { duration: 15000, easing: Easing.out(Easing.sin) });
    hillFrontScale.value = withTiming(1.02, { duration: 15000, easing: Easing.out(Easing.sin) });

    // Sheep walks in perfectly mapped to leg loop duration
    lambTranslateX.value = withDelay(1000, withTiming(0, { duration: 3750, easing: Easing.out(Easing.sin) }));
    
    // Title appears at the exact moment the sheep opens its mouth, and softly scales up continuously
    textOpacity.value = withDelay(5100, withTiming(1, { duration: 2500, easing: Easing.out(Easing.ease) }));
    textTranslateY.value = withDelay(5100, withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }));
    textScale.value = withDelay(5100, withTiming(1.02, { duration: 8000, easing: Easing.out(Easing.sin) }));
    
    const timer = setTimeout(() => {
      // Fast fade to black (500ms)
      blackOutOpacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });

      // Transition immediately after black out completes
      setTimeout(() => {
        useSessionStore.getState().completeIntro();
        onComplete();
      }, 500);
    }, 8500);

    return () => clearTimeout(timer);
  }, []);

  const masterStyle = useAnimatedStyle(() => ({ 
    opacity: masterOpacity.value,
    transform: [{ scale: posterScale.value }]
  }));
  const hillsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hillsTranslateY.value }] }));
  const hillBackStyle = useAnimatedStyle(() => ({ transform: [{ scale: hillBackScale.value }] }));
  const hillMidStyle = useAnimatedStyle(() => ({ transform: [{ scale: hillMidScale.value }] }));
  const hillFrontStyle = useAnimatedStyle(() => ({ transform: [{ scale: hillFrontScale.value }] }));
  const lambStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lambTranslateX.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value, transform: [{ translateY: textTranslateY.value }, { scale: textScale.value }] }));
  const skyBlushStyle = useAnimatedStyle(() => ({ opacity: skyBlushOpacity.value }));
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ scale: sunPulse.value }] }));
  const skyStyle = useAnimatedStyle(() => ({ backgroundColor: skyColor.value }));
  const blackOutStyle = useAnimatedStyle(() => ({ opacity: blackOutOpacity.value }));

  return (
    <Animated.View style={[styles.container, masterStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, skyStyle]} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.skyBlush, skyBlushStyle]} />
      
      {/* Warm Sun Glow & Text */}
      <View style={styles.sunContainer}>
        <Animated.View style={[styles.sunRing, sunStyle]} />
        <Animated.View style={[styles.sunGlow, sunStyle]} />
        <Animated.View style={[styles.sunTextWrapper, textStyle]}>
          <Text style={styles.titleMay}>May</Text>
          <Text style={styles.subtitleFriends}>learn · grow · bloom</Text>
        </Animated.View>
      </View>

      {/* Gentle Clouds */}
      <Cloud top="15%" speed={40000} scale={1} delay={0} opacity={0.6} />
      <Cloud top="25%" speed={55000} scale={0.7} delay={15000} opacity={0.4} />
      <Cloud top="40%" speed={45000} scale={1.2} delay={5000} opacity={0.5} />

      {/* Happy Little Birds */}
      <Bird top="20%" delay={1000} duration={15000} scale={0.8} />
      <Bird top="32%" delay={6000} duration={12000} scale={1.2} />
      <Bird top="26%" delay={14000} duration={18000} scale={0.6} />

      {/* Rolling Hills */}
      <Animated.View style={[StyleSheet.absoluteFill, hillsStyle]} pointerEvents="none">
        <Animated.View style={[styles.hill, styles.hillBack, hillBackStyle]} />
        <Animated.View style={[styles.hill, styles.hillMid, hillMidStyle]} />
        <Animated.View style={[styles.hill, styles.hillFront, hillFrontStyle]} />
      </Animated.View>

      {/* Floating Pollen Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Pollen key={i} index={i} />
        ))}
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        
        <Animated.View style={[lambStyle, { marginBottom: 170 }]} pointerEvents="none">
          <LittleLamb />
        </Animated.View>

      </View>

      {/* Blackout overlay for transition */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', zIndex: 100 }, blackOutStyle]} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 999, backgroundColor: 'transparent' },
  sky: { backgroundColor: '#A8C8E8' },
  skyBlush: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '45%',
    backgroundColor: '#D4EAC8',
  },
  
  sunContainer: { position: 'absolute', top: '12%', left: '50%', width: 300, height: 300, transform: [{ translateX: -150 }], alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  sunRing: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: '#FFF3A0', opacity: 0.35 },
  sunGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FFE566', shadowColor: '#FFB800', shadowOpacity: 0.6, shadowRadius: 60, elevation: 10 },
  sunTextWrapper: { alignItems: 'center', justifyContent: 'center' },
  titleMay: {
    color: '#C05E0A',
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitleFriends: {
    color: '#D4820F',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'lowercase',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  cloud: { position: 'absolute', width: 160, height: 52, backgroundColor: '#FFFFFF', borderRadius: 26, shadowColor: '#B8D4F0', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, opacity: 0.88 },
  
  birdWingLeft: { width: 14, height: 3, backgroundColor: '#94A3B8', borderRadius: 2, position: 'absolute', left: -11, transform: [{ rotate: '25deg' }] },
  birdWingRight: { width: 14, height: 3, backgroundColor: '#94A3B8', borderRadius: 2, position: 'absolute', left: 0, transform: [{ rotate: '-25deg' }] },

  hill: { position: 'absolute' },
  hillBack: { width: 1000, height: 800, borderRadius: 500, backgroundColor: '#68B896', bottom: -400, left: -200 },
  hillMid: { width: 1200, height: 900, borderRadius: 600, backgroundColor: '#8FD4B0', bottom: -450, right: -400 },
  hillFront: { width: 1400, height: 1000, borderRadius: 700, backgroundColor: '#C2E8D2', bottom: -550, left: -500 },
  
  pollen: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFA', shadowColor: '#FFF9C4', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '15%', zIndex: 20 },
  
  // Lamb Details
  lambContainer: { alignItems: 'center', justifyContent: 'center' },
  lambShadow: { width: 70, height: 18, backgroundColor: 'rgba(40, 80, 60, 0.14)', borderRadius: 35, position: 'absolute', bottom: -30, transform: [{ scaleX: 1.6 }] },
  lambTail: { width: 20, height: 20, backgroundColor: '#FFFFFF', borderRadius: 10, position: 'absolute', right: -6, top: 40, shadowColor: '#9CB4D8', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 2, height: 2 } },
  lambBody: { width: 100, height: 75, backgroundColor: '#FFFFFF', borderRadius: 40, shadowColor: '#9CB4D8', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  lambFluff1: { width: 60, height: 60, backgroundColor: '#FFFFFF', borderRadius: 30, position: 'absolute', top: -20, left: -5 },
  lambFluff2: { width: 70, height: 70, backgroundColor: '#FFFFFF', borderRadius: 35, position: 'absolute', top: -25, right: 5 },
  lambHead: { width: 60, height: 56, backgroundColor: '#FFFFFF', borderRadius: 30, position: 'absolute', top: -15, left: -20, shadowColor: '#9CB4D8', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: -2, height: 2 } },
  lambEyeLeft: { width: 7, height: 7, backgroundColor: '#334155', borderRadius: 3.5, position: 'absolute', top: 24, left: 14 },
  lambEyeRight: { width: 7, height: 7, backgroundColor: '#334155', borderRadius: 3.5, position: 'absolute', top: 24, left: 38 },
  lambBlushLeft: { width: 10, height: 5, backgroundColor: '#FBCFE8', borderRadius: 2.5, position: 'absolute', top: 34, left: 8, opacity: 0.8 },
  lambBlushRight: { width: 10, height: 5, backgroundColor: '#FBCFE8', borderRadius: 2.5, position: 'absolute', top: 34, left: 42, opacity: 0.8 },
  lambSmile: { position: 'absolute', top: 32, left: 26, width: 8, height: 4, borderBottomWidth: 1.5, borderColor: '#334155', borderRadius: 4 },
  lambMouthOpen: { position: 'absolute', top: 32, left: 27, width: 6, height: 6, backgroundColor: '#334155', borderRadius: 3 },
  lambEarLeft: { width: 22, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, position: 'absolute', top: 12, left: -14 },
  lambEarRight: { width: 22, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, position: 'absolute', top: 12, right: -14 },
  lambLeg1: { width: 10, height: 24, backgroundColor: '#CBD5E1', borderRadius: 5, position: 'absolute', bottom: -16, left: 16, zIndex: -1 },
  lambLeg2: { width: 10, height: 24, backgroundColor: '#CBD5E1', borderRadius: 5, position: 'absolute', bottom: -16, left: 40, zIndex: -1 },
  lambLeg3: { width: 10, height: 24, backgroundColor: '#94A3B8', borderRadius: 5, position: 'absolute', bottom: -20, right: 34, zIndex: -2 },
  lambLeg4: { width: 10, height: 24, backgroundColor: '#94A3B8', borderRadius: 5, position: 'absolute', bottom: -20, right: 12, zIndex: -2 },
});