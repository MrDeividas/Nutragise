import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OB } from './onboardingTheme';

interface Props {
  streakLabel?: string;
  streakValue?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  badge?: string;
  brand?: string;
}

export default function MemberProgressCard({
  streakLabel = 'ACTIVE STREAK',
  streakValue = '0 days',
  secondaryLabel = 'JOINED',
  secondaryValue,
  badge = 'MEMBER',
  brand = 'NTR',
}: Props) {
  const date =
    secondaryValue ||
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <LinearGradient
      colors={['#34D399', '#10B981', '#F59E0B', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>{brand}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeStar}>★</Text>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.metaLabel}>{streakLabel}</Text>
          <Text style={styles.metaValue}>{streakValue}</Text>
        </View>
        <View style={styles.rightMeta}>
          <Text style={styles.metaLabel}>{secondaryLabel}</Text>
          <Text style={styles.metaValueSm}>{date}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: 28,
    padding: 22,
    minHeight: 210,
    justifyContent: 'space-between',
    ...OB.cardShadow,
    shadowOpacity: 0.2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  badgeStar: {
    color: '#fff',
    fontSize: 11,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightMeta: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  metaValueSm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
