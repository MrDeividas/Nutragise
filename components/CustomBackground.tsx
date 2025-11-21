import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CustomBackgroundProps {
  children: React.ReactNode;
}

export default function CustomBackground({ children }: CustomBackgroundProps) {
  return (
    <View style={styles.container}>{children}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAF9',
  },
}); 