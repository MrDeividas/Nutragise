import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';

export default function MeditationScreen({ navigation }: any) {
  const { theme } = useTheme();

  const meditationSessions = [
    {
      id: '1',
      title: 'Calm',
      duration: '10 min',
      category: 'Relaxation & Sleep',
      icon: 'moon-outline',
    },
    {
      id: '2',
      title: 'Focus',
      duration: '8 min',
      category: 'Productivity & Performance',
      icon: 'eye-outline',
    },
    {
      id: '3',
      title: 'Grow',
      duration: '12 min',
      category: 'Self-Development & Growth',
      icon: 'trending-up-outline',
    },
    {
      id: '4',
      title: 'Connect',
      duration: '15 min',
      category: 'Mindfulness & Compassion',
      icon: 'heart-outline',
    },
  ];

  const renderMeditationCard = (session: any) => (
    <TouchableOpacity
      key={session.id}
      style={[styles.card, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}
      onPress={() => {
        // Navigate to meditation session
        console.log('Open meditation:', session.title);
      }}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          {session.title}
        </Text>
        {session.id === '1' ? (
          <View>
            <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
              Relaxation
            </Text>
            <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
              & Sleep
            </Text>
          </View>
        ) : (
          <Text style={[styles.cardCategory, { color: theme.textSecondary }]}>
            {session.category}
          </Text>
        )}
        <View style={styles.cardDurationContainer}>
          <Ionicons name="time-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.cardDuration, { color: theme.textTertiary }]}>
            {session.duration}
          </Text>
        </View>
      </View>
      <View style={styles.cardIconContainer}>
        <Ionicons name={session.icon as any} size={24} color={theme.textPrimary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Meditation
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Find peace and clarity with guided sessions
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={[styles.cardsContainer, Platform.OS === 'android' && { gap: undefined }] }>
          <View style={styles.gridRow}>
            {meditationSessions.slice(0, 2).map((session, idx) => (
              <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                {renderMeditationCard(session)}
              </View>
            ))}
          </View>
          <View style={styles.gridRow}>
            {meditationSessions.slice(2, 4).map((session, idx) => (
              <View key={session.id} style={[styles.gridRowItem, Platform.OS === 'android' && idx === 0 && { marginRight: 12 }]}>
                {renderMeditationCard(session)}
              </View>
            ))}
          </View>
        </View>
        
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.statsTitle, { color: theme.textPrimary }]}>
            Your Meditation Stats
          </Text>
          <View style={[styles.statsGrid, Platform.OS === 'android' && { gap: undefined }]}>
            <View style={[styles.statCard, Platform.OS === 'android' && { marginRight: 12 }, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="time-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                12 min
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Avg Session
              </Text>
            </View>
            
            <View style={[styles.statCard, Platform.OS === 'android' && { marginRight: 12 }, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="timer-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                4h 32m
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Time
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.textPrimary} />
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                24
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Sessions
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 12,
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: Platform.select({ android: 34 }),
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardsContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridRowItem: {
    flex: 1,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: Platform.select({ android: 20 }),
  },
  cardCategory: {
    fontSize: 10,
    marginBottom: 4,
  },
  cardDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: Platform.select({ android: 22 }),
  },
  statLabel: {
    fontSize: 12,
    lineHeight: Platform.select({ android: 16 }),
  },
}); 