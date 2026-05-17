import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay
} from 'react-native-reanimated';
import { useSessionStore } from '../../core/sessionStore';

export default function FloatingDialogue() {
  const { dialogueText, status, theme } = useSessionStore();
  const isLavender = theme === 'Lavender Calm';
  const [displayedText, setDisplayedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const floatY = useSharedValue(0);

  // Continuous soft floating loop
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  // Visibility and Auto-Hide Logic
  useEffect(() => {
    // Allows the future system to inject random ambient thoughts during the idle wandering state
    if (dialogueText && status !== 'listening') {
      setDisplayedText(dialogueText);
      setIsVisible(true);
      
      // Gently float up and fade in
      opacity.value = withTiming(1, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      translateY.value = withTiming(0, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

      // Auto-hide safely if the user stays inactive for 10 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        opacity.value = withTiming(0, { duration: 2500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        translateY.value = withTiming(-40, { duration: 2500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }); // Drifts higher as it fades
      }, 10000);

      return () => clearTimeout(hideTimer);
    } else {
      // User started interacting (recording/stopped/idle) - drift away peacefully
      setIsVisible(false);
      opacity.value = withTiming(0, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      translateY.value = withTiming(-40, { duration: 1500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }
  }, [dialogueText, status]);

  // Emotional Styling Engine
  let shadowColor = '#E6E6FA';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  let backgroundColor = 'rgba(255, 255, 255, 0.08)';

  if (status === 'thinking') {
    shadowColor = '#B5D8EB';
    borderColor = 'rgba(181, 216, 235, 0.2)';
    backgroundColor = 'rgba(181, 216, 235, 0.05)';
  } else if (status === 'speaking') {
    shadowColor = '#FFFFFF';
    borderColor = 'rgba(255, 255, 255, 0.25)';
    backgroundColor = 'rgba(255, 255, 255, 0.12)';
  } else if (status === 'cooldown') {
    shadowColor = '#FFDF6B';
    borderColor = 'rgba(255, 223, 107, 0.2)';
    backgroundColor = 'rgba(255, 223, 107, 0.08)';
  } else if (status === 'paused') {
    shadowColor = '#A8E6CF';
    borderColor = 'rgba(168, 230, 207, 0.2)';
    backgroundColor = 'rgba(168, 230, 207, 0.05)';
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value + floatY.value }],
    shadowColor,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.shadowWrapper, animatedStyle]}>
        <View style={[styles.bubble, { borderColor }]}>
          {/* Blur must be wrapped securely in the bubble for clean rounded corners */}
          <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
          <ProgressiveText key={displayedText} text={displayedText} isVisible={isVisible} isLavender={isLavender} />
        </View>
      </Animated.View>
    </View>
  );
}

// Splits text into words and orchestrates the conversational delay
const ProgressiveText = ({ text, isVisible, isLavender }: { text: string, isVisible: boolean, isLavender: boolean }) => {
  const words = text.split(' ');
  return (
    <View style={styles.textContainer}>
      {words.map((word, index) => (
        <FadeInWord key={index} word={word} index={index} isVisible={isVisible} isLavender={isLavender} />
      ))}
    </View>
  );
};

const FadeInWord = ({ word, index, isVisible, isLavender }: { word: string, index: number, isVisible: boolean, isLavender: boolean }) => {
  const wordOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Staggered fade in: ~200ms per word creates a calm, deliberate reading/speaking pace
      wordOpacity.value = withDelay(index * 200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
    }
  }, [isVisible]);

  const style = useAnimatedStyle(() => ({ opacity: wordOpacity.value }));

  return <Animated.Text style={[isLavender ? styles.text : styles.textEngaging, style]}>{word} </Animated.Text>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '42%', // Anchors securely relative to Nimo's floor position, never overlapping top UI
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  shadowWrapper: {
    shadowOffset: { width: 0, height: 12 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 24, 
    elevation: 10,
    maxWidth: '85%',
  },
  bubble: {
    paddingHorizontal: 28, paddingVertical: 20,
    borderRadius: 36, 
    borderWidth: 1, // Softer edges
    overflow: 'hidden', // Clips the cinematic BlurView cleanly
  },
  textContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  text: { color: '#F8FAFC', fontSize: 17, fontWeight: '400', letterSpacing: 0.6, lineHeight: 28, textShadowColor: 'rgba(255,255,255,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  textEngaging: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', letterSpacing: 0.6, lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
});