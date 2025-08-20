import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CustomBackgroundProps {
  children: React.ReactNode;
}

export default function CustomBackground({ children }: CustomBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Black base background */}
      <View style={styles.blackBackground} />
      
      {/* Dark grey glow - top */}
      <LinearGradient
        colors={['rgba(64, 64, 64, 0.25)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topGlow}
      />
      
      {/* Purple glow - bottom left */}
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.08)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomLeftGlow}
      />
      
      {/* Purple glow - bottom right */}
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.06)', 'transparent']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.bottomRightGlow}
      />
      
      {/* Purple glow - bottom side */}
      <LinearGradient
        colors={['rgba(147, 51, 234, 0.05)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.bottomSideGlow}
      />
      
      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#141414',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderRadius: 0,
  },
  bottomLeftGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
  },
  bottomRightGlow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%',
    borderRadius: 0,
  },
  bottomSideGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderRadius: 0,
  },
}); 