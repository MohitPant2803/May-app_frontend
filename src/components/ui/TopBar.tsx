import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BookOpen, Settings, Pause, Play, Square, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import GlassPanel from './GlassPanel';
import RecordButton from './RecordButton';
import { useSessionStore } from '../../core/sessionStore';

// Live Session Timer Component
const SessionTimer = ({ isPaused, isLavender }: { isPaused: boolean, isLavender: boolean }) => {
  const status = useSessionStore((state) => state.status);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (status === 'cooldown' || status === 'idle' || isPaused) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status, isPaused]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerDot} />
      <Text style={[styles.timerText, { textShadowColor: isLavender ? 'transparent' : 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: isLavender ? 0 : 1 }, textShadowRadius: isLavender ? 0 : 2 }]}>{mins}:{secs}</Text>
    </View>
  );
};

export default function TopBar() {
  const insets = useSafeAreaInsets();
  
  const status = useSessionStore((state) => state.status);
  const pauseListening = useSessionStore((state) => state.pauseListening);
  const startListening = useSessionStore((state) => state.startListening);
  const stopListening = useSessionStore((state) => state.stopListening);
  const triggerCooldown = useSessionStore((state) => state.triggerCooldown);
  const setActiveOverlay = useSessionStore((state) => state.setActiveOverlay);
  const theme = useSessionStore((state) => state.theme);

  const isLavender = theme === 'Lavender Calm';
  const iconColor = isLavender ? '#5C6B73' : '#F8FAFC';
  const profileTextColor = isLavender ? '#5C6B73' : '#F8FAFC';

  const isActiveSession = status !== 'idle';
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  // Dreamy 8-second ambient floating animation
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  let profileText = 'Feeling Peaceful';
  if (status === 'listening') profileText = 'Listening...';
  else if (status === 'thinking') profileText = 'May is thinking...';
  else if (status === 'cooldown') profileText = 'Session Complete';
  else if (status !== 'idle') profileText = 'Session Active';

  return (
    <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) + 100 }]} pointerEvents="box-none">
      <Animated.View style={[styles.container, floatingStyle]} pointerEvents="box-none">
        
        {/* Unified Floating Island */}
        <GlassPanel style={styles.island}>
          
          {/* LEFT: Memories / Journal */}
          {isActiveSession ? (
            <View style={styles.sideButtonContainer}>
              <SessionTimer isPaused={showEndConfirm} isLavender={isLavender} />
            </View>
          ) : (
            <Pressable style={styles.sideButtonContainer} hitSlop={15} onPress={() => setActiveOverlay('timeline')}>
              <BookOpen size={24} color={iconColor} strokeWidth={1.5} />
            </Pressable>
          )}

          {/* CENTER: Main Record Button (Breaks out of the island slightly) */}
          <View style={styles.centerArea} pointerEvents="box-none">
            <RecordButton />
          </View>

          {/* RIGHT: Settings / Stop */}
          {isActiveSession || status === 'cooldown' ? (
            <Animated.View style={styles.sideButtonContainer}>
              <Pressable hitSlop={15} onPress={() => {
                if (status === 'cooldown') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  triggerCooldown();
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  pauseListening(); // Makes the environment calm and stops recording immediately
                  useSessionStore.setState({ dialogueText: '' }); // Gently fade out any active floating dialogues
                  setShowEndConfirm(true);
                }
              }}>
                {status === 'cooldown' ? (
                  <CheckCircle size={24} color="#A8E6CF" strokeWidth={1.5} />
                ) : (
                  <Square size={24} color="#E57373" strokeWidth={1.5} />
                )}
              </Pressable>
            </Animated.View>
          ) : (
            <Pressable style={styles.sideButtonContainer} hitSlop={15} onPress={() => setActiveOverlay('profile')}>
              <Settings size={24} color={iconColor} strokeWidth={1.5} />
            </Pressable>
          )}
          
        </GlassPanel>

        {/* SUBTLE MOOD PROFILE PILL */}
        <Pressable style={styles.profileWrapper}>
          <GlassPanel style={styles.profilePill}>
            <View style={styles.statusDot} />
            <Text style={[styles.profileText, { color: profileTextColor, textShadowColor: isLavender ? 'transparent' : 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: isLavender ? 0 : 1 }, textShadowRadius: isLavender ? 0 : 2 }]}>{profileText}</Text>
          </GlassPanel>
        </Pressable>

      </Animated.View>

      {/* End Session Confirmation Modal */}
      <Modal visible={showEndConfirm} transparent={true} animationType="fade">
         <View style={styles.confirmOverlay}>
            <GlassPanel style={styles.confirmCard}>
               <Text style={styles.confirmTitle}>May still has a few questions...</Text>
               <View style={styles.confirmActionColumn}>
                  <Pressable style={styles.answerBtn} onPress={() => {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     setShowEndConfirm(false);
                     const questions = [
                       "Wait... could you explain the last part again?",
                       "I'm a little stuck on how that connects...",
                       "What if the opposite happens?"
                     ];
                     useSessionStore.setState({ dialogueText: questions[Math.floor(Math.random() * questions.length)] });
                  }}>
                     <Text style={styles.answerBtnText}>Answer Them</Text>
                  </Pressable>
                  <Pressable style={styles.enoughBtn} onPress={() => {
                     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                     setShowEndConfirm(false);
                     const closings = [
                       "You explained more clearly today.",
                       "I could feel your confidence improving.",
                       "You paused less near the end.",
                       "That was a meaningful session."
                     ];
                     useSessionStore.setState({ dialogueText: closings[Math.floor(Math.random() * closings.length)] });
                     triggerCooldown();
                  }}>
                     <Text style={styles.enoughBtnText}>Enough For Today</Text>
                  </Pressable>
               </View>
            </GlassPanel>
         </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    maxWidth: 400,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    shadowColor: '#B5D8EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  sideButton: { 
    padding: 12, 
    opacity: 0.7,
  },
  sideButtonContainer: { 
    width: 64, // Fixed width anchors sides to keep middle button perfectly centered
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  centerArea: { 
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  timerContainer: { flexDirection: 'row', alignItems: 'center' },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E57373', marginRight: 6, shadowColor: '#E57373', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  timerText: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  
  profileWrapper: { marginTop: 16 },
  profilePill: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A8E6CF', marginRight: 8, shadowColor: '#A8E6CF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  profileText: { color: '#5C6B73', fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(10, 15, 25, 0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  confirmCard: { width: '100%', maxWidth: 360, padding: 32, borderRadius: 36, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 },
  confirmTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '600', marginBottom: 32, textAlign: 'center', lineHeight: 30, letterSpacing: 0.5 },
  confirmActionColumn: { flexDirection: 'column', gap: 16 },
  answerBtn: { paddingVertical: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(255, 223, 107, 0.15)', borderColor: 'rgba(255, 223, 107, 0.3)', borderWidth: 1 },
  answerBtnText: { color: '#FFDF6B', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  enoughBtn: { paddingVertical: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1 },
  enoughBtnText: { color: '#B5D8EB', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});