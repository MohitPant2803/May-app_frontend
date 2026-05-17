import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../core/store';
import AmbientBackground from '../../components/animations/AmbientBackground';
import { tokens } from '../../theme/tokens';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Brain, Quote } from 'lucide-react-native';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { entries } = useStore();
  
  const entry = entries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Entry not found</Text>
      </View>
    );
  }

  const dateObj = new Date(entry.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <AmbientBackground />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={tokens.colors.text.primary} size={28} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.moodRow}>
            <View style={[styles.moodDot, { backgroundColor: tokens.colors.emotion[entry.mood] || tokens.colors.brand.primary }]} />
            <Text style={styles.moodText}>Feeling {entry.mood}</Text>
          </View>
          
          <Text style={styles.summaryTitle}>{entry.summary}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.transcriptBox}>
            <Quote color={tokens.colors.text.muted} size={20} style={{ marginBottom: tokens.spacing.sm }} />
            <Text style={styles.transcript}>{entry.transcript}</Text>
          </View>

          {entry.insights && entry.insights.length > 0 && (
            <View style={styles.insightsContainer}>
              <View style={styles.insightsHeader}>
                <Brain color={tokens.colors.brand.warmGlow} size={18} />
                <Text style={styles.insightsTitle}>AI Insights</Text>
              </View>
              {entry.insights.map((insight, idx) => (
                <View key={idx} style={styles.insightItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          )}
        </BlurView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.deepMidnight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    zIndex: 10,
  },
  backBtn: {
    padding: tokens.spacing.xs,
  },
  dateText: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.body,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 100,
  },
  card: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.xl,
    borderWidth: 1,
    borderColor: tokens.colors.background.glassBorder,
    backgroundColor: tokens.colors.background.translucent,
    overflow: 'hidden',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  moodText: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.sans,
    textTransform: 'capitalize',
  },
  summaryTitle: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.display,
    fontSize: tokens.typography.sizes.h2,
    lineHeight: tokens.typography.lineHeights.h2,
    marginBottom: tokens.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.background.glassBorder,
    marginBottom: tokens.spacing.lg,
  },
  transcriptBox: {
    marginBottom: tokens.spacing.xl,
  },
  transcript: {
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.body,
    lineHeight: tokens.typography.lineHeights.body,
    fontStyle: 'italic',
  },
  insightsContainer: {
    backgroundColor: 'rgba(255, 160, 122, 0.05)',
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  insightsTitle: {
    color: tokens.colors.brand.warmGlow,
    fontFamily: tokens.typography.fontFamily.display,
    fontSize: tokens.typography.sizes.body,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.brand.warmGlow,
    marginTop: 8,
  },
  insightText: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.caption,
    lineHeight: 20,
    flex: 1,
  },
  notFound: {
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginTop: 100,
  }
});
