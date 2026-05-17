import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sparkles, BrainCircuit, Lightbulb, Target, Check, HeartHandshake } from 'lucide-react-native';
import GlassPanel from '../../components/ui/GlassPanel';
import { useSessionStore } from '../../core/sessionStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Reusable floating cinematic card
const FloatingCard = ({ children, delay, style }: { children: React.ReactNode, delay: number, style?: any }) => (
  <Animated.View entering={FadeInUp.delay(delay).duration(1200).springify().damping(20).mass(1)} style={styles.cardWrapper}>
    <GlassPanel style={[styles.floatingCard, style]}>
      {children}
    </GlassPanel>
  </Animated.View>
);

export default function SessionReflectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentReflection, endSession, setActiveOverlay, theme } = useSessionStore();
  const [confidence, setConfidence] = useState<string | null>(null);

  // Lock the reflection data on mount so it doesn't disappear during the fade-out transition when endSession clears it
  const [reflection] = useState(currentReflection);

  useEffect(() => {
    // As soon as the reflection overlay is hit, end the session state.
    // This makes Nimo immediately go back to the idle state and start wandering in the background.
    endSession();
  }, []);

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveOverlay('timeline'); // Opens Notes in background underneath the fade
    router.back(); // Safely dismiss the modal to reveal the already-loaded Home screen
  };

  if (!reflection) return null; // Failsafe

  const overlayStyle = useAnimatedStyle(() => {
    let bgColor = 'rgba(10, 15, 25, 0.65)'; // Default/Lavender Calm
    switch(theme) {
      case 'Midnight Focus': bgColor = 'rgba(3, 7, 18, 0.85)'; break;
      case 'Rainy Evening': bgColor = 'rgba(15, 23, 42, 0.8)'; break;
      case 'Warm Sunset': bgColor = 'rgba(45, 25, 20, 0.85)'; break;
      case 'Forest Silence': bgColor = 'rgba(6, 40, 30, 0.85)'; break;
    }
    return { backgroundColor: withTiming(bgColor, { duration: 500 }) };
  }, [theme]);

  return (
    <View style={styles.container}>
      
      {/* Deep cinematic blur entry */}
      <Animated.View entering={FadeIn.duration(2000)} style={StyleSheet.absoluteFill} pointerEvents="none">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} />
      </Animated.View>
      
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Memory Reflection</Text>
          <Text style={styles.subtitle}>{reflection.topic}</Text>
        </View>

        {/* Emotional Daily Placard */}
        <FloatingCard delay={200} style={styles.placardCard}>
          <Sparkles color="#E6E6FA" size={24} style={{ marginBottom: 12, opacity: 0.9 }} />
          <Text style={styles.placardText}>"{reflection.placard.text}"</Text>
        </FloatingCard>

        {/* Moments of Clarity */}
        <FloatingCard delay={400}>
          <View style={styles.sectionHeaderRow}>
            <Check color="#A8E6CF" size={18} />
            <Text style={[styles.sectionTitle, { color: '#A8E6CF' }]}>Moments of Clarity</Text>
          </View>
          {reflection.explainedWell.map((pt, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: '#A8E6CF' }]} />
              <Text style={styles.bodyText}>{pt}</Text>
            </View>
          ))}
        </FloatingCard>

        {/* Areas for Growth */}
        <FloatingCard delay={600}>
          <View style={styles.sectionHeaderRow}>
            <Target color="#FFAAA6" size={18} />
            <Text style={[styles.sectionTitle, { color: '#FFAAA6' }]}>Areas for Growth</Text>
          </View>
          {reflection.struggledWith.map((pt, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: '#FFAAA6' }]} />
              <Text style={styles.bodyText}>{pt}</Text>
            </View>
          ))}
        </FloatingCard>

        {/* Priority Revision */}
        <FloatingCard delay={800}>
          <View style={styles.sectionHeaderRow}>
            <BrainCircuit color="#B5D8EB" size={18} />
            <Text style={[styles.sectionTitle, { color: '#B5D8EB' }]}>Revision Focus</Text>
          </View>
          <View style={styles.chipRow}>
            {reflection.revisionFocus.map((pt, i) => (
              <View key={i} style={styles.chip}><Text style={styles.chipText}>{pt}</Text></View>
            ))}
          </View>
        </FloatingCard>

        {/* Nimo's Doubts Memory */}
        <FloatingCard delay={1000}>
          <View style={styles.sectionHeaderRow}>
            <Lightbulb color="#FFDF6B" size={18} />
            <Text style={[styles.sectionTitle, { color: '#FFDF6B' }]}>May's Questions</Text>
          </View>
          {reflection.nimoDoubts.map((pt, i) => (
            <View key={i} style={styles.bulletRow}>
               <Text style={styles.nimoDoubtText}>"{pt}"</Text>
            </View>
          ))}
        </FloatingCard>

        {/* Confidence Check */}
        <FloatingCard delay={1200}>
           <View style={[styles.sectionHeaderRow, { justifyContent: 'center', marginBottom: 20 }]}>
             <HeartHandshake color="#E6E6FA" size={18} />
             <Text style={[styles.sectionTitle, { color: '#E6E6FA', marginLeft: 10 }]}>How do you feel now?</Text>
           </View>
           <View style={styles.confidenceRow}>
              {['Still Unsure', 'Getting There', 'Fully Confident'].map(lvl => (
                <Pressable key={lvl} onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setConfidence(lvl);
                }} style={[styles.confBtn, confidence === lvl && styles.confBtnActive]}>
                  <Text style={[styles.confText, confidence === lvl && styles.confTextActive]}>{lvl}</Text>
                </Pressable>
              ))}
           </View>
        </FloatingCard>

        {/* Finish Button */}
        <Animated.View entering={FadeInUp.delay(1400).duration(1200)} style={{ marginTop: 16, marginBottom: 40, alignItems: 'center' }}>
          <Pressable onPress={handleFinish}>
            <GlassPanel style={styles.finishBtn}>
              <Text style={styles.finishText}>Store in Memory</Text>
            </GlassPanel>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1, zIndex: 10 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  
  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '700', letterSpacing: 0.5, textShadowColor: 'rgba(255,255,255,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  subtitle: { color: '#B5D8EB', fontSize: 15, fontWeight: '500', marginTop: 8, letterSpacing: 1, textTransform: 'uppercase' },

  cardWrapper: { marginBottom: 16 },
  floatingCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 20, 35, 0.45)', // Slightly darkened backdrop
    borderColor: 'rgba(255, 255, 255, 0.12)', // Soft borders
    borderWidth: 1,
    shadowColor: '#B5D8EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30, // Ambient shadows
  },

  placardCard: { alignItems: 'center', backgroundColor: 'rgba(230, 230, 250, 0.08)', borderColor: 'rgba(230, 230, 250, 0.2)' },
  placardText: { color: '#F8FAFC', fontSize: 18, fontWeight: '500', fontStyle: 'italic', textAlign: 'center', lineHeight: 28, letterSpacing: 0.5, textShadowColor: 'rgba(230, 230, 250, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginLeft: 10, textShadowColor: 'rgba(255,255,255,0.15)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingRight: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 10, marginRight: 14, opacity: 0.9 },
  bodyText: { color: '#E2E8F0', fontSize: 16, lineHeight: 26, fontWeight: '400', flex: 1, letterSpacing: 0.3 },
  
  nimoDoubtText: { color: '#FFDF6B', fontSize: 16, lineHeight: 26, fontWeight: '500', fontStyle: 'italic', flex: 1, letterSpacing: 0.3 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(181, 216, 235, 0.15)', borderColor: 'rgba(181, 216, 235, 0.3)', borderWidth: 1 },
  chipText: { color: '#B5D8EB', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  confBtn: { flex: 1, paddingVertical: 14, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  confBtnActive: { backgroundColor: 'rgba(230, 230, 250, 0.15)', borderColor: '#E6E6FA', shadowColor: '#E6E6FA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
  confText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  confTextActive: { color: '#F8FAFC' },

  finishBtn: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1 },
  finishText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});