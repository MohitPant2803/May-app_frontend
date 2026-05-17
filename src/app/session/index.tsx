import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export default function SessionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Session Detail Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.deepMidnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.sizes.body,
  },
});
