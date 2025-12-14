import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import CustomBackground from '../components/CustomBackground';
import { PREMADE_WORKOUT_SPLITS, PremadeWorkoutSplit } from '../lib/workoutSplitsData';
import { workoutSplitService } from '../lib/workoutSplitService';
import { useAuthStore } from '../state/authStore';
import { WorkoutSplit } from '../types/database';

interface WorkoutSplitScreenProps {
  navigation: any;
  route?: any;
}

export default function WorkoutSplitScreen({ navigation, route }: WorkoutSplitScreenProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const [activeTab, setActiveTab] = useState<'premade' | 'custom'>('premade');
  const [customSplits, setCustomSplits] = useState<WorkoutSplit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSplitIndex, setExpandedSplitIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user && activeTab === 'custom') {
      loadCustomSplits();
    }
  }, [user, activeTab]);

  const loadCustomSplits = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const splits = await workoutSplitService.getAllSplits(user.id);
      const customOnly = splits.filter(s => s.split_type === 'custom');
      setCustomSplits(customOnly);
    } catch (error) {
      console.error('Error loading custom splits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPremadeSplit = async (split: PremadeWorkoutSplit) => {
    if (!user) return;

    try {
      setLoading(true);
      // Check if this premade split already exists for user
      const existingSplits = await workoutSplitService.getAllSplits(user.id);
      const existing = existingSplits.find(
        s => s.split_type === 'premade' && s.premade_split_name === split.name
      );

      let splitId: string;

      if (existing) {
        // Use existing split
        splitId = existing.id;
      } else {
        // Create new split from premade
        // Convert Exercise objects back to string arrays for database
        const daysForDb = split.days.map(day => ({
          day: day.day,
          focus: day.focus,
          exercises: day.exercises.map(ex => ex.name), // Convert Exercise[] to string[]
        }));
        
        const newSplit = await workoutSplitService.createSplit(user.id, {
          split_name: split.name,
          split_type: 'premade',
          frequency: split.frequency,
          premade_split_name: split.name,
          days: daysForDb,
        });
        splitId = newSplit.id;
      }

      // Set as active
      await workoutSplitService.setActiveSplit(user.id, splitId);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error selecting split:', error);
      alert(error.message || 'Failed to select split');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomSplit = async (split: WorkoutSplit) => {
    if (!user) return;

    try {
      setLoading(true);
      await workoutSplitService.setActiveSplit(user.id, split.id);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error selecting split:', error);
      alert(error.message || 'Failed to select split');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Choose Split</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('premade')}
            style={[
              styles.tab,
              activeTab === 'premade' && { borderBottomWidth: 2, borderBottomColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'premade' ? theme.primary : theme.textSecondary },
              ]}
            >
              Premade
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('custom')}
            style={[
              styles.tab,
              activeTab === 'custom' && { borderBottomWidth: 2, borderBottomColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'custom' ? theme.primary : theme.textSecondary },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
        >
          {activeTab === 'premade' ? (
            <View style={styles.content}>
              {PREMADE_WORKOUT_SPLITS.map((split, index) => {
                const isExpanded = expandedSplitIndex === index;
                return (
                  <View
                    key={index}
                    style={[styles.splitCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectPremadeSplit(split)}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <View style={styles.splitCardHeader}>
                        <Text style={[styles.splitName, { color: theme.textPrimary }]}>{split.name}</Text>
                        <View style={styles.headerIcons}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setExpandedSplitIndex(isExpanded ? null : index);
                            }}
                            style={styles.infoButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
                          </TouchableOpacity>
                          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </View>
                      </View>
                      <Text style={[styles.splitFrequency, { color: theme.textSecondary }]}>
                        {split.frequency}
                      </Text>
                      <Text style={[styles.splitDays, { color: theme.textSecondary }]}>
                        {split.days.length} {split.days.length === 1 ? 'day' : 'days'}
                      </Text>
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        {split.days.map((day, dayIndex) => (
                          <View key={dayIndex} style={styles.daySection}>
                            <Text style={[styles.dayTitle, { color: theme.textPrimary }]}>
                              {day.day} {day.focus && `- ${day.focus}`}
                            </Text>
                            <View style={styles.exercisesList}>
                              {day.exercises.map((exercise, exerciseIndex) => (
                                <View key={exerciseIndex} style={styles.exerciseItem}>
                                  <View style={[styles.exerciseBullet, { backgroundColor: theme.primary }]} />
                                  <View style={styles.exerciseInfo}>
                                    <Text style={[styles.exerciseName, { color: theme.textPrimary }]}>
                                      {exercise.name}
                                    </Text>
                                    <Text style={[styles.exerciseSetsReps, { color: theme.textSecondary }]}>
                                      {exercise.sets} sets × {exercise.reps} reps
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.content}>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateCustomSplit')}
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Custom Split</Text>
              </TouchableOpacity>

              {loading ? (
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
              ) : customSplits.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="fitness-outline" size={64} color="#d1d5db" />
                  <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                    No custom splits yet
                  </Text>
                </View>
              ) : (
                customSplits.map((split) => (
                  <TouchableOpacity
                    key={split.id}
                    onPress={() => handleSelectCustomSplit(split)}
                    style={[styles.splitCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                    activeOpacity={0.7}
                    disabled={loading}
                  >
                    <View style={styles.splitCardHeader}>
                      <Text style={[styles.splitName, { color: theme.textPrimary }]}>{split.split_name}</Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </View>
                    {split.frequency && (
                      <Text style={[styles.splitFrequency, { color: theme.textSecondary }]}>
                        {split.frequency}
                      </Text>
                    )}
                    <Text style={[styles.splitDays, { color: theme.textSecondary }]}>
                      {split.days.length} {split.days.length === 1 ? 'day' : 'days'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 12,
  },
  splitCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  splitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    marginBottom: 8,
  },
  exerciseBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  exerciseSetsReps: {
    fontSize: 13,
    marginLeft: 8,
  },
  splitName: {
    fontSize: 18,
    fontWeight: '700',
  },
  splitFrequency: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  splitDays: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
  },
});
