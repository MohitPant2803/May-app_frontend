import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'heavy';
}

export default function GlassPanel({ children, style, intensity = 'medium' }: GlassPanelProps) {
  // Note: If you install `expo-blur`, you can replace this View with <BlurView intensity={20}>
  return (
    <View style={[styles.glass, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255, 250, 244, 0.15)', // Muted warm cream, highly transparent
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 999, // Organic rounded shapes
    shadowColor: '#4A3B32', // Soft earthy shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
});