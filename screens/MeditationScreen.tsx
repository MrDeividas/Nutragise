import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';
import { pointsService } from '../lib/pointsService';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import { supabase } from '../lib/supabase';

export default function MeditationScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  
  const handleCompleteMeditation = async () => {
    try {
      // Get user from auth store (same way actionStore does it)
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;
      
      console.log('🧘 Button pressed, user from getState():', userId);
      
      if (!userId) {
        console.error('❌ No user ID found');
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        return;
      }
      
      console.log('🧘 Completing meditation for user:', userId);
      const success = await pointsService.trackDailyHabit(userId, 'meditation');
      
      if (success) {
        // Reload daily habits to update the segments properly
        const today = new Date();
        const hour = today.getHours();
        const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
        const dateString = dateToUse.toISOString().split('T')[0];
        
        await useActionStore.getState().loadDailyHabits(dateString);
        
        Alert.alert('Success', 'Meditation completed! +15 points\n\nCheck the Action page to see it highlighted.');
        console.log('✅ Meditation tracked successfully and daily habits reloaded');
      } else {
        Alert.alert('Info', 'Meditation already completed today or not eligible for points');
        console.log('ℹ️ Meditation tracking returned false');
      }
    } catch (error) {
      console.error('Error completing meditation:', error);
      Alert.alert('Error', 'Failed to complete meditation: ' + error);
    }
  };

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
        {/* TEST BUTTON - Complete Meditation */}
        <View style={{ padding: 20, backgroundColor: 'rgba(255, 193, 7, 0.1)', margin: 16, borderRadius: 12 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            TEST MODE
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
            User: {user ? user.id.substring(0, 8) + '...' : 'Not loaded'}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleCompleteMeditation}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              ✓ Complete Meditation (+15 pts)
            </Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
            Click to mark meditation as complete and award points
          </Text>
        </View>
        
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