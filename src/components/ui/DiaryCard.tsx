import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { DiaryEntry } from '../../core/store';
import { tokens } from '../../theme/tokens';
import { Calendar, Brain } from 'lucide-react-native';

interface DiaryCardProps {
  entry: DiaryEntry;
}

export default function DiaryCard({ entry }: DiaryCardProps) {
  const router = useRouter();
  
  const dateObj = new Date(entry.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const moodColor = tokens.colors.emotion[entry.mood] || tokens.colors.brand.primary;

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => router.push(`/session/${entry.id}` as any)}
      style={styles.container}
    >
      <BlurView intensity={20} tint="light" style={styles.blurContainer}>
        <View style={styles.header}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={tokens.colors.text.muted} />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
        </View>

        <Text style={styles.summary}>{entry.summary}</Text>

        {entry.insights.length > 0 && (
          <View style={styles.insightBox}>
            <Brain size={14} color={tokens.colors.brand.warmGlow} style={{ marginTop: 2 }} />
            <Text style={styles.insightText}>{entry.insights[0]}</Text>
          </View>
        )}
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.background.glassBorder,
    backgroundColor: tokens.colors.background.translucent,
  },
  blurContainer: {
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  dateText: {
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.caption,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  summary: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.body,
    lineHeight: tokens.typography.lineHeights.body,
    marginBottom: tokens.spacing.md,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 160, 122, 0.1)',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    gap: tokens.spacing.xs,
    alignItems: 'flex-start',
  },
  insightText: {
    color: tokens.colors.brand.warmGlow,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.caption,
    flex: 1,
  },
});
