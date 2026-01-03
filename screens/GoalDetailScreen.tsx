import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { dailyPostsService, CreateDailyPostData } from '../lib/dailyPostsService';
import { getDailyPostDate } from '../lib/timeService';
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
  
  // Update box state
  const [updateText, setUpdateText] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [updateImage, setUpdateImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

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
      'Delete Update',
      'Are you sure you want to delete this update? This action cannot be undone.',
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
                Alert.alert('Success', 'Update deleted successfully');
                // Reload the progress photos
                loadProgressPhotos();
                // Notify parent screen to refresh check-in status
                if (onCheckInDeleted) {
                  onCheckInDeleted();
                }
              } else {
                Alert.alert('Error', 'Failed to delete update. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting update:', error);
              Alert.alert('Error', 'Failed to delete update. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handlePickUpdateImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUpdateImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handlePostUpdate = async () => {
    if (!updateText.trim() && !updateImage) {
      Alert.alert('Empty Update', 'Please add some text or an image to post an update.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post an update.');
      return;
    }

    setIsPosting(true);
    try {
      // 1. Create progress_photos entry
      const checkInResult = await progressService.createCheckIn({
        goalId: goal.id,
        userId: user.id,
        photoUri: updateImage || undefined,
        note: updateText.trim() || undefined,
        checkInDate: new Date()
      });

      if (!checkInResult) {
        throw new Error('Failed to save progress update');
      }

      // 2. Also add to daily post (activity feed)
      const dailyPostDate = getDailyPostDate(new Date());
      const existingDailyPost = await dailyPostsService.getDailyPostByDate(user.id, dailyPostDate);
      
      const dailyPostData: CreateDailyPostData = {
        photos: updateImage ? [updateImage] : [],
        captions: updateText.trim() ? [updateText.trim()] : [],
        habits_completed: []
      };

      let dailyPostResult;
      if (existingDailyPost) {
        dailyPostResult = await dailyPostsService.addToDailyPost(existingDailyPost.id, dailyPostData);
      } else {
        dailyPostResult = await dailyPostsService.createDailyPost(user.id, dailyPostDate, dailyPostData);
      }

      if (!dailyPostResult) {
        console.warn('Failed to add update to daily post, but progress photo was saved');
      }

      Alert.alert('Success', 'Update posted successfully!');
      
      // Reload progress photos to show the new update
      loadProgressPhotos();
      
      // Clear the form
      setUpdateText('');
      setUpdateImage(null);
      setSelectedMilestone(null);
    } catch (error) {
      console.error('Error posting update:', error);
      Alert.alert('Error', 'Failed to post update. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdateTextChange = (text: string) => {
    // Capitalize first letter
    if (text.length > 0 && updateText.length === 0) {
      setUpdateText(text.charAt(0).toUpperCase() + text.slice(1));
    } else {
      setUpdateText(text);
    }
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
            <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Goal Details</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
        >
        {/* Goal Overview Card */}
        <View style={[styles.overviewCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalIcon}>{getCategoryIcon(goal.category || 'default')}</Text>
            <View style={styles.goalInfo}>
              <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
              <Text style={[styles.goalCategory, { color: theme.textSecondary }]}>{goal.category}</Text>
            </View>
          </View>
          <Text style={[styles.goalDescription, { color: theme.textPrimary }]}>{goal.description}</Text>
        </View>

        {/* Update Box */}
        <View style={[styles.updateCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={styles.updateHeader}>
            <Ionicons name="create-outline" size={20} color={theme.primary} />
            <Text style={[styles.updateTitle, { color: theme.textPrimary }]}>Post an Update</Text>
          </View>
          
          <TextInput
            style={[styles.updateInput, { color: theme.textPrimary, borderColor: '#E5E7EB' }]}
            placeholder="What progress have you made?"
            placeholderTextColor={theme.textSecondary}
            value={updateText}
            onChangeText={handleUpdateTextChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
          />

          {/* Image Preview */}
          {updateImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: updateImage }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setUpdateImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.updateActions}>
            <TouchableOpacity 
              style={styles.updateActionButton}
              onPress={handlePickUpdateImage}
            >
              <Ionicons name="image-outline" size={20} color={theme.primary} />
              <Text style={[styles.updateActionText, { color: theme.primary }]}>Add Photo</Text>
            </TouchableOpacity>

            {goal.milestones && goal.milestones.length > 0 && (
              <TouchableOpacity 
                style={styles.updateActionButton}
                onPress={() => {
                  Alert.alert(
                    'Link to Milestone',
                    'Select a milestone to link this update to:',
                    goal.milestones.map((milestone: any) => ({
                      text: milestone.title,
                      onPress: () => setSelectedMilestone(milestone.id)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Ionicons name="flag-outline" size={20} color={theme.primary} />
                <Text style={[styles.updateActionText, { color: theme.primary }]}>
                  {selectedMilestone ? 'Milestone Linked' : 'Link Milestone'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.postButton, 
                { 
                  backgroundColor: theme.primary,
                  opacity: isPosting ? 0.6 : 1
                }
              ]}
              onPress={handlePostUpdate}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
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
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Updates</Text>
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
          <View style={[styles.detailsCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
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

        {/* Progress Card */}
        <View style={[styles.progressPhotosCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Progress</Text>
            {progressPhotos.length > 0 && (
              <Text style={[styles.photoCount, { color: theme.textSecondary }]}>{progressPhotos.length}</Text>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
          ) : progressPhotos.length > 0 ? (
            <View style={styles.updatesList}>
              {progressPhotos.map((photo, index) => (
                <View 
                  key={photo.id} 
                  style={[
                    styles.updateItem, 
                    { 
                      borderBottomColor: '#E5E7EB',
                      borderBottomWidth: index === progressPhotos.length - 1 ? 0 : 1
                    }
                  ]}
                >
                  <View style={styles.updateContent}>
                    <View style={styles.updateTextContainer}>
                      <Text style={[styles.updateDate, { color: theme.textSecondary }]}>
                        {photo.check_in_date 
                          ? new Date(photo.check_in_date).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : new Date(photo.date_uploaded).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                        }
                      </Text>
                      {photo.note && (
                        <Text style={[styles.updateText, { color: theme.textPrimary }]}>
                          {photo.note}
                        </Text>
                      )}
                    </View>
                    {photo.photo_url && photo.photo_url !== 'no-photo' && (
                      <View style={styles.updateImageContainer}>
                      <Image 
                        source={{ uri: photo.photo_url }} 
                          style={styles.updateImage}
                      />
                        <TouchableOpacity
                          style={styles.updateDeleteButton}
                          onPress={() => handleDeleteCheckIn(photo)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {(!photo.photo_url || photo.photo_url === 'no-photo') && (
                    <TouchableOpacity
                        style={styles.updateDeleteButtonText}
                      onPress={() => handleDeleteCheckIn(photo)}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No updates yet</Text>
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
    padding: 4,
    width: 32,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  overviewCard: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  updateCard: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  updateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  updateActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  updateActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  postButton: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  updatesList: {
    gap: 0,
  },
  updateItem: {
    paddingVertical: 16,
  },
  updateContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  updateTextContainer: {
    flex: 1,
    gap: 6,
  },
  updateDate: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  updateText: {
    fontSize: 15,
    lineHeight: 22,
  },
  updateImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateImage: {
    width: '100%',
    height: '100%',
  },
  updateDeleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  updateDeleteButtonText: {
    padding: 4,
  },
}); 