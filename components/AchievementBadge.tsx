import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { ImageSourcePropType } from 'react-native';

type Props = {
  image: ImageSourcePropType;
  unlocked: boolean;
  size?: number;
  style?: ViewStyle;
};

export default function AchievementBadge({ image, unlocked, size = 56, style }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={image}
        style={[
          styles.image,
          { width: size, height: size },
          !unlocked && styles.locked,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    // transparent PNGs
  },
  locked: {
    opacity: 0.32,
  },
});
