import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { OB } from './onboardingTheme';

const backgroundImage = require('../../../assets/onboarding/onboarding-background.png');

/** Full-screen mountain illustration — cream sky up top, peaks at bottom */
export default function OnboardingBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={backgroundImage}
        style={styles.image}
        contentFit="cover"
        contentPosition="bottom"
      />
      {/* Light top wash so headers stay crisp; peaks stay visible below */}
      <LinearGradient
        colors={[
          'rgba(252, 250, 249, 0.45)',
          'rgba(252, 250, 249, 0.18)',
          'transparent',
          'transparent',
        ]}
        locations={[0, 0.3, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OB.bg,
  },
});
