import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeOut, SlideInRight, SlideOutRight, LinearTransition } from 'react-native-reanimated';
import { ArrowLeft, Flame, Sparkles, BrainCircuit, Edit3, CheckCircle, Target, ChevronRight, ChevronDown, Calendar, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import GlassPanel from './GlassPanel';
import { useSessionStore, SessionHistory } from '../../core/sessionStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Inline Editable Topic Component
const EditableTopic = ({ topic, onSave }: { topic: string, onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(topic);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (val.trim() && val !== topic) onSave(val.trim());
    else setVal(topic);
  };

  if (isEditing) {
    return (
      <TextInput
        ref={inputRef}
        style={styles.editableInput}
        value={val}
        onChangeText={setVal}
        onBlur={handleSave}
        onSubmitEditing={handleSave}
        returnKeyType="done"
      />
    );
  }
  return (
    <Pressable onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsEditing(true);
    }} hitSlop={10} style={styles.topicPressable}>
      <Text style={styles.sessionTopic}>{topic}</Text>
      <Edit3 size={16} color="rgba(255,255,255,0.4)" style={{ marginLeft: 8 }} />
    </Pressable>
  );
};

const SessionPreviewCard = ({ session, onPress }: { session: SessionHistory, onPress: () => void }) => {
  return (
    <Pressable onPress={() => {
      Haptics.selectionAsync();
      onPress();
    }}>
      <GlassPanel style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewTopic}>{session.topic}</Text>
            <Text style={styles.previewMeta}>{session.duration}  •  {session.mood}</Text>
          </View>
          <View style={styles.previewChevron}><ChevronRight size={20} color="#B5D8EB" /></View>
        </View>
        {session.aiInsights.length > 0 && (
          <View style={styles.previewInsightBox}>
            <Target size={14} color="#FFDF6B" style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.previewInsightText} numberOfLines={1}>"{session.aiInsights[0]}"</Text>
          </View>
        )}
      </GlassPanel>
    </Pressable>
  );
};

export default function MemoryJournalOverlay() {
  const insets = useSafeAreaInsets();
  const { sessionHistory, setActiveOverlay, updateSessionTopic } = useSessionStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Group sessions by Date
  const groupedSessions = useMemo(() => {
    return sessionHistory.reduce((acc, session) => {
      if (!acc[session.date]) acc[session.date] = [];
      acc[session.date].push(session);
      return acc;
    }, {} as Record<string, SessionHistory[]>);
  }, [sessionHistory]);

  const selectedSession = sessionHistory.find(s => s.id === selectedSessionId);

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.4)' }]} pointerEvents="none" />
      
      {/* --- LIST VIEW --- */}
      {!selectedSessionId && (
        <Animated.ScrollView entering={FadeIn} exiting={FadeOut} style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Pressable onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveOverlay('none');
            }} hitSlop={20} style={styles.backButton}>
              <ArrowLeft color="#E6E6FA" size={28} />
            </Pressable>
            <View>
              <Text style={styles.title}>Memory Journal</Text>
              <Text style={styles.subtitle}>Reflections with May</Text>
            </View>
            <GlassPanel style={styles.streakBadge}>
              <Flame color="#FFAAA6" size={16} />
              <Text style={styles.streakText}>3 Days</Text>
            </GlassPanel>
          </View>

          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={{ marginTop: 30 }}>
            <Text style={styles.sectionLabel}><BrainCircuit color="#B5D8EB" size={16} style={{marginRight: 6}}/> Learning Timeline</Text>
            
            {Object.entries(groupedSessions).map(([date, sessions], index) => {
              // Manage expand/collapse state locally per day card
              const DayGroup = () => {
                const [isExpanded, setIsExpanded] = useState(index === 0); // First item expanded by default
                const totalMins = sessions.reduce((sum, s) => sum + parseInt(s.duration), 0);

                return (
                  <Animated.View layout={LinearTransition.springify()} style={styles.dayGroupContainer}>
                    <Pressable onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsExpanded(!isExpanded);
                    }} style={styles.dayHeaderRow}>
                      <Calendar size={18} color="#E6E6FA" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.dayDateText}>{date}</Text>
                        <Text style={styles.daySubText}>{sessions.length} Session{sessions.length > 1 ? 's' : ''}  •  {totalMins} mins total</Text>
                      </View>
                      <View style={styles.dayChevronContainer}>
                        {isExpanded ? <ChevronDown size={20} color="#B5D8EB" /> : <ChevronRight size={20} color="#B5D8EB" />}
                      </View>
                    </Pressable>
                    
                    {isExpanded && (
                      <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOut.duration(200)} style={styles.sessionsList}>
                        {sessions.map((s, i) => (
                          <SessionPreviewCard key={s.id} session={s} onPress={() => setSelectedSessionId(s.id)} />
                        ))}
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              };
              return <DayGroup key={date} />;
            })}
          </Animated.View>
        </Animated.ScrollView>
      )}

      {/* --- DEEP SESSION DETAIL VIEW --- */}
      {selectedSessionId && selectedSession && (
        <Animated.ScrollView entering={SlideInRight.duration(400)} exiting={SlideOutRight.duration(400)} style={[styles.scroll, { position: 'absolute', width: '100%', height: '100%' }]} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
           <View style={styles.header}>
            <Pressable onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSessionId(null);
            }} hitSlop={20} style={styles.backButton}>
              <ArrowLeft color="#E6E6FA" size={28} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailTitle}>Session Memory</Text>
              <Text style={styles.subtitle}>{selectedSession.date}</Text>
            </View>
          </View>

          <GlassPanel style={styles.sessionCard}>
            {/* Meta & Topic Header */}
            <View style={styles.sessionHeader}>
              <View style={styles.metaRow}>
                <Clock size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.sessionMeta}>{selectedSession.duration}</Text>
                <Text style={styles.sessionMetaDivider}>•</Text>
                <Text style={styles.sessionMetaMood}>{selectedSession.mood}</Text>
              </View>
              <EditableTopic topic={selectedSession.topic} onSave={(newTopic) => updateSessionTopic(selectedSession.id, newTopic)} />
            </View>
            
            <View style={styles.divider} />
            
            {/* AI Notes (Revision Summary) */}
            <View style={styles.notesContainer}>
              <View style={styles.sessionSubRow}>
                <CheckCircle size={14} color="#B5D8EB" />
                <Text style={styles.sessionSubText}>Revision Summary</Text>
              </View>
              {selectedSession.aiNotes.map((note, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: '#B5D8EB' }]} />
                  <Text style={styles.sessionValue}>{note}</Text>
                </View>
              ))}
            </View>

            {/* AI Insights (Weak Points & Growth) */}
            <View style={styles.insightsContainer}>
              <View style={styles.sessionSubRow}>
                <Target size={14} color="#FFDF6B" />
                <Text style={[styles.sessionSubText, { color: '#FFDF6B' }]}>May's Insights</Text>
              </View>
              {selectedSession.aiInsights.map((insight, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: '#FFDF6B' }]} />
                  <Text style={[styles.sessionValue, { color: '#FFFAF4' }]}>{insight}</Text>
                </View>
              ))}
            </View>
          </GlassPanel>
        </Animated.ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  scroll: { flex: 1, zIndex: 10 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 },
  backButton: { padding: 8, marginLeft: -8 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  detailTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { color: '#B5D8EB', fontSize: 14, fontWeight: '500', marginTop: 4 },
  
  streakBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)' },
  streakText: { color: '#FFFFFF', fontWeight: '600', marginLeft: 6, fontSize: 13 },
  
  sectionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  
  // --- Day Grouping Styles ---
  dayGroupContainer: { marginBottom: 24 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 8 },
  dayDateText: { color: '#F8FAFC', fontSize: 18, fontWeight: '600', letterSpacing: 0.3, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  daySubText: { color: '#B5D8EB', fontSize: 13, fontWeight: '500', marginTop: 2 },
  dayChevronContainer: { padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  
  sessionsList: { marginTop: 12, gap: 12 },
  
  // --- Preview Card Styles ---
  previewCard: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewTopic: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  previewMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewChevron: { opacity: 0.8 },
  previewInsightBox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: 'rgba(255, 223, 107, 0.08)', borderRadius: 12 },
  previewInsightText: { color: '#FFDF6B', fontSize: 13, fontWeight: '500', fontStyle: 'italic', flex: 1 },

  // --- Detail View Styles ---
  sessionCard: { padding: 24, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  sessionHeader: { marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sessionMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 6 },
  sessionMetaDivider: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },
  sessionMetaMood: { color: '#A8E6CF', fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  
  topicPressable: { flexDirection: 'row', alignItems: 'center' },
  sessionTopic: { 
    color: '#FFFFFF', fontSize: 22, fontWeight: '700', letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 
  },
  editableInput: { 
    color: '#FFFFFF', fontSize: 22, fontWeight: '700', letterSpacing: 0.3,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.4)', paddingBottom: 4 
  },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  
  notesContainer: { 
    backgroundColor: 'rgba(0,0,0,0.15)', // Deep grounding contrast
    padding: 20, borderRadius: 20, marginBottom: 16 
  },
  insightsContainer: { 
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 20, borderRadius: 20 
  },
  
  sessionSubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  sessionSubText: { color: '#B5D8EB', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingRight: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 10, marginRight: 12, opacity: 0.8 },
  sessionValue: { 
    color: '#F8FAFC', 
    fontSize: 16, 
    lineHeight: 26, // Deeply expanded line height for reading
    fontWeight: '400', 
    flex: 1 
  },
});