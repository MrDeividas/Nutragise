import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OB } from './onboardingTheme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showArrow?: boolean;
  variant?: 'primary' | 'white' | 'ghost';
}

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
  showArrow = true,
  variant = 'primary',
}: Props) {
  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.ghost, style]}
        activeOpacity={0.7}
      >
        <Text style={[styles.ghostText, textStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'white') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.whiteBtn, disabled && styles.disabled, style]}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={OB.text} />
        ) : (
          <>
            <Text style={[styles.whiteText, textStyle]}>{label}</Text>
            {showArrow && (
              <Ionicons name="arrow-forward-circle" size={28} color={OB.text} style={{ marginLeft: 8 }} />
            )}
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[styles.wrap, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[OB.primary, OB.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={[styles.label, textStyle]}>{label}</Text>
            {showArrow && <Text style={styles.arrow}> →</Text>}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 999,
    overflow: 'hidden',
    ...OB.cardShadow,
    shadowColor: OB.primary,
    shadowOpacity: 0.35,
  },
  gradient: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 999,
  },
  label: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrow: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  whiteBtn: {
    backgroundColor: OB.white,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    ...OB.cardShadow,
  },
  whiteText: {
    color: OB.text,
    fontSize: 16,
    fontWeight: '700',
  },
  ghost: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostText: {
    color: OB.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.45,
  },
});
