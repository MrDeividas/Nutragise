import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { progressService, ProgressPhoto } from '../lib/progressService';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

// Define the navigation param list for the Goals stack
export type GoalsStackParamList = {
  GoalsList: undefined;
  NewGoal: undefined;
  GoalDetail: { goal: Goal; onCheckInDeleted?: () => void };
};

type Props = NativeStackScreenProps<any, 'GoalDetail'> & { 
  route: { params: { goal: Goal; onCheckInDeleted?: () => void } } 
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const { width } = Dimensions.get('window');

// Helper function to get category icon (same as profile page)
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'fitness':
      return '🏃‍♂️';
    case 'nutrition':
      return '🥗';
    case 'mental health':
      return '🧠';
    case 'learning':
      return '📚';
    case 'career':
      return '💼';
    case 'relationships':
      return '❤️';
    case 'finance':
      return '💰';
    case 'creativity':
      return '🎨';
    default:
      return '🎯';
  }
};

export default function GoalDetailScreen({ navigation, route }: Props) {
  const { goal, onCheckInDeleted } = route.params;
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Use setTimeout to defer heavy operations to next tick
      const timer = setTimeout(() => {
        loadProgressPhotos();
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Ensure proper cleanup when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup when screen loses focus
        setProgressPhotos([]);
        setLoading(true);
      };
    }, [])
  );

  const loadProgressPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const photos = await progressService.getProgressPhotos(goal.id, user.id);
      setProgressPhotos(photos);
    } catch (error) {
      console.error('Error loading progress photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCheckIn = (photo: ProgressPhoto) => {
    Alert.alert(
      'Delete Check-in',
      'Are you sure you want to delete this check-in? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await progressService.deleteCheckIn(photo.id, photo.photo_url);
              if (success) {
                Alert.alert('Success', 'Check-in deleted successfully');
                // Reload the progress photos
                loadProgressPhotos();
                // Notify parent screen to refresh check-in status
                if (onCheckInDeleted) {
                  onCheckInDeleted();
                }
              } else {
                Alert.alert('Error', 'Failed to delete check-in. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting check-in:', error);
              Alert.alert('Error', 'Failed to delete check-in. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <CustomBackground>
      <View style={styles.container}>
        {/* Fixed Header */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Goal Details</Text>
          </View>
        </SafeAreaView>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
        >
        {/* Goal Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalIcon}>{getCategoryIcon(goal.category || 'default')}</Text>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
              <Text style={[styles.goalCategory, { color: theme.textSecondary }]}>{goal.category}</Text>
            </View>
          </View>
          <Text style={[styles.goalDescription, { color: theme.textPrimary }]}>{goal.description}</Text>
        </View>

        {/* Goal Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Goal Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Start Date</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{goal.start_date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>End Date</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{goal.end_date || 'Ongoing'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Time Commitment</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{goal.time_commitment || 'Not specified'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Check-ins</Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{progressPhotos.length}</Text>
            </View>
          </View>

          <View style={styles.frequencySection}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Frequency</Text>
            <View style={styles.frequencyDays}>
              {daysOfWeek.map((day, index) => (
                <View 
                  key={day} 
                  style={[
                    styles.frequencyDay,
                    { backgroundColor: 'rgba(128, 128, 128, 0.2)' },
                    goal.frequency && goal.frequency[index] && styles.activeFrequencyDay
                  ]}
                >
                  <Text style={[
                    styles.frequencyDayText,
                    { color: theme.textSecondary },
                    goal.frequency && goal.frequency[index] && styles.activeFrequencyDayText
                  ]}>
                    {day.charAt(0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Success Criteria Card */}
        {(goal.success_criteria || (goal.milestones && goal.milestones.length > 0)) && (
          <View style={[styles.detailsCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Success Plan</Text>
            
            {goal.success_criteria && (
              <View style={styles.criteriaSection}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Success Criteria</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{goal.success_criteria}</Text>
              </View>
            )}

            {Array.isArray(goal.milestones) && goal.milestones.length > 0 && (
              <View style={styles.milestonesSection}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Milestones</Text>
                {goal.milestones.map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <View style={styles.milestoneNumber}>
                      <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.milestoneText, { color: theme.textPrimary }]}>{milestone}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Progress Photos Card */}
        <View style={[styles.progressPhotosCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Progress Photos</Text>
            {progressPhotos.length > 0 && (
              <Text style={[styles.photoCount, { color: theme.textSecondary }]}>{progressPhotos.length}</Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
          ) : progressPhotos.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScrollContent}
            >
              {progressPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <View style={styles.photoContainer}>
                    {photo.photo_url && photo.photo_url !== 'no-photo' ? (
                      <Image 
                        source={{ uri: photo.photo_url }} 
                        style={styles.progressPhoto}
                      />
                    ) : (
                      <View style={[styles.noPhotoPlaceholder, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                        <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteCheckIn(photo)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.photoDate, { color: theme.textSecondary }]}>
                    {photo.check_in_date ? new Date(photo.check_in_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : new Date(photo.date_uploaded).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No progress photos yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  overviewCard: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsCard: {
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  frequencySection: {
    marginTop: 8,
  },
  frequencyDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  frequencyDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFrequencyDay: {
    backgroundColor: '#EA580C',
  },
  frequencyDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeFrequencyDayText: {
    color: '#ffffff',
  },
  criteriaSection: {
    marginBottom: 16,
  },
  milestonesSection: {
    marginTop: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  milestoneText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: (width - 88) / 2, // 2 photos per row with margins
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 6,
    width: '100%',
    aspectRatio: 1,
  },
  progressPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDate: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  photoNote: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  progressPhotosCard: {
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  photosScrollContent: {
    gap: 12,
    paddingRight: 8,
  },
  photoItem: {
    width: 100,
    alignItems: 'center',
  },
}); 