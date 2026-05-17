import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ArrowLeft, Moon, Music, Sparkles } from 'lucide-react-native';
import GlassPanel from './GlassPanel';
import { useSessionStore, MoodTheme, Personality } from '../../core/sessionStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOODS: MoodTheme[] = ['Lavender Calm', 'Midnight Focus', 'Rainy Evening', 'Warm Sunset'];
const PERSONALITIES: Personality[] = ['Curious', 'Calm', 'Energetic', 'Gentle Teacher'];

export default function EnvironmentSettingsOverlay() {
  const insets = useSafeAreaInsets();
  const { theme, personality, askMoreQuestions, updateSetting, setActiveOverlay } = useSessionStore();

  const overlayStyle = useAnimatedStyle(() => {
    let bgColor = 'rgba(15, 23, 42, 0.5)'; // Default/Lavender Calm
    switch(theme) {
      case 'Midnight Focus': bgColor = 'rgba(3, 7, 18, 0.75)'; break;
      case 'Rainy Evening': bgColor = 'rgba(15, 23, 42, 0.7)'; break;
      case 'Warm Sunset': bgColor = 'rgba(45, 25, 20, 0.75)'; break;
      case 'Forest Silence': bgColor = 'rgba(6, 40, 30, 0.75)'; break;
    }
    return { backgroundColor: withTiming(bgColor, { duration: 500 }) };
  }, [theme]);

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} pointerEvents="none" />
      
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Pressable onPress={() => setActiveOverlay('none')} hitSlop={20} style={styles.backButton}>
            <ArrowLeft color="#E6E6FA" size={28} />
          </Pressable>
          <View>
            <Text style={styles.title}>Environment</Text>
            <Text style={styles.subtitle}>Calm your surroundings</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View entering={FadeInUp.delay(100).duration(800)}>
          <View style={styles.sectionLabelRow}>
            <Moon color="#B5D8EB" size={16} />
            <Text style={styles.sectionLabelText}>Mood Theme</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {MOODS.map((m) => (
              <Pressable key={m} onPress={() => updateSetting('theme', m)}>
                <GlassPanel style={[styles.pillCard, theme === m && styles.pillActive]}>
                  <Text style={[styles.pillText, theme === m && styles.pillTextActive]}>{m}</Text>
                </GlassPanel>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={{ marginTop: 32 }}>
          <View style={styles.sectionLabelRow}>
            <Sparkles color="#A8E6CF" size={16} />
            <Text style={styles.sectionLabelText}>May's Personality</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {PERSONALITIES.map((p) => (
              <Pressable key={p} onPress={() => updateSetting('personality', p)}>
                <GlassPanel style={[styles.pillCard, personality === p && styles.pillActive]}>
                  <Text style={[styles.pillText, personality === p && styles.pillTextActive]}>{p}</Text>
                </GlassPanel>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(800)} style={{ marginTop: 32 }}>
           <View style={styles.sectionLabelRow}>
             <Music color="#FFAAA6" size={16} />
             <Text style={styles.sectionLabelText}>Companion Preferences</Text>
           </View>
           
           <GlassPanel style={styles.settingRow}>
             <View style={{ flex: 1 }}>
               <Text style={styles.settingTitle}>Ask More Questions</Text>
               <Text style={styles.settingDesc}>May will frequently pause to clarify doubts.</Text>
             </View>
             <Switch 
               value={askMoreQuestions} 
               onValueChange={(val) => updateSetting('askMoreQuestions', val)} 
               trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#A8E6CF' }}
               thumbColor="#FFF"
             />
           </GlassPanel>
        </Animated.View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  scroll: { flex: 1, zIndex: 10 },
  content: { paddingHorizontal: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  backButton: { padding: 8, marginLeft: -8 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: '#B5D8EB', fontSize: 14, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionLabelText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  horizontalScroll: { gap: 12, paddingRight: 24 },
  pillCard: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: '#FFFFFF' },
  pillText: { color: '#B5D8EB', fontSize: 15, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  settingTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { color: '#5C6B73', fontSize: 13, fontWeight: '500', lineHeight: 18, paddingRight: 20 },
});