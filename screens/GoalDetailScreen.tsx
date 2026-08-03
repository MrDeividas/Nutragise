import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { dailyPostsService, CreateDailyPostData } from '../lib/dailyPostsService';
import { getDailyPostDate } from '../lib/timeService';
import { Goal } from '../types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { progressService, ProgressPhoto } from '../lib/progressService';
import { moderationAlertMessage } from '../lib/safeMediaUpload';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

// Define the navigation param list for the Goals stack
export type GoalsStackParamList = {
  GoalsList: { openWorkout?: boolean } | undefined;
  NewGoal: undefined;
  GoalDetail: { goal: Goal; onCheckInDeleted?: () => void };
};

type Props = NativeStackScreenProps<any, 'GoalDetail'> & { 
  route: { params: { goal: Goal; onCheckInDeleted?: () => void } } 
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DARK = '#1f2937';

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
      // 1. Create progress_photos entry (uploads local URI → public Storage URL)
      const checkInResult = await progressService.createCheckIn({
        goalId: goal.id,
        userId: user.id,
        photoUri: updateImage || undefined,
        note: updateText.trim() || undefined,
        checkInDate: new Date()
      });

      if (!checkInResult.success) {
        throw new Error('Failed to save progress update');
      }

      // 2. Also add to daily post (activity feed) using the uploaded URL
      const dailyPostDate = getDailyPostDate(new Date());
      const existingDailyPost = await dailyPostsService.getDailyPostByDate(user.id, dailyPostDate);
      const publicPhotoUrl = checkInResult.photoUrl;
      
      const dailyPostData: CreateDailyPostData = {
        photos: publicPhotoUrl ? [publicPhotoUrl] : [],
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
      Alert.alert('Upload blocked', moderationAlertMessage(error));
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
      <View style={[styles.container, { backgroundColor: '#F8F9FB' }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Goal</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 28, paddingTop: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.goalHeader}>
              <View style={styles.goalIconWrap}>
                <Text style={styles.goalIcon}>{getCategoryIcon(goal.category || 'default')}</Text>
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {!!goal.category && <Text style={styles.goalCategory}>{goal.category}</Text>}
              </View>
            </View>
            {!!goal.description && <Text style={styles.goalDescription}>{goal.description}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Post an update</Text>
            <TextInput
              style={styles.updateInput}
              placeholder="What progress have you made?"
              placeholderTextColor="#9CA3AF"
              value={updateText}
              onChangeText={handleUpdateTextChange}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect
            />

            {updateImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: updateImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setUpdateImage(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={DARK} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.updateActions}>
              <TouchableOpacity style={styles.secondaryChip} onPress={handlePickUpdateImage} activeOpacity={0.85}>
                <Ionicons name="image-outline" size={16} color={DARK} />
                <Text style={styles.secondaryChipText}>Add photo</Text>
              </TouchableOpacity>

              {goal.milestones && goal.milestones.length > 0 ? (
                <TouchableOpacity
                  style={[styles.secondaryChip, selectedMilestone ? styles.secondaryChipActive : null]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert(
                      'Link to Milestone',
                      'Select a milestone to link this update to:',
                      goal.milestones!
                        .map((milestone: string, index: number) => ({
                          text: typeof milestone === 'string' ? milestone : `Milestone ${index + 1}`,
                          onPress: () => setSelectedMilestone(String(index)),
                        }))
                        .concat([{ text: 'Cancel', style: 'cancel' } as any])
                    );
                  }}
                >
                  <Ionicons name="flag-outline" size={16} color={selectedMilestone ? '#FFFFFF' : DARK} />
                  <Text style={[styles.secondaryChipText, selectedMilestone ? styles.secondaryChipTextActive : null]}>
                    {selectedMilestone ? 'Milestone linked' : 'Link milestone'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isPosting && { opacity: 0.55 }]}
              onPress={handlePostUpdate}
              disabled={isPosting}
              activeOpacity={0.88}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Post update</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Details</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailTile}>
                <Text style={styles.detailLabel}>Start</Text>
                <Text style={styles.detailValue}>{goal.start_date || '—'}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailLabel}>End</Text>
                <Text style={styles.detailValue}>{goal.end_date || 'Ongoing'}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailLabel}>Commitment</Text>
                <Text style={styles.detailValue}>{goal.time_commitment || 'Not set'}</Text>
              </View>
              <View style={styles.detailTile}>
                <Text style={styles.detailLabel}>Updates</Text>
                <Text style={styles.detailValue}>{progressPhotos.length}</Text>
              </View>
            </View>

            <Text style={[styles.detailLabel, { marginTop: 14, marginBottom: 8 }]}>Frequency</Text>
            <View style={styles.frequencyDays}>
              {daysOfWeek.map((day, index) => {
                const active = !!(goal.frequency && goal.frequency[index]);
                return (
                  <View key={day} style={[styles.frequencyDay, active && styles.frequencyDayActive]}>
                    <Text style={[styles.frequencyDayText, active && styles.frequencyDayTextActive]}>
                      {day.charAt(0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {(goal.success_criteria || (goal.milestones && goal.milestones.length > 0)) && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Success plan</Text>
              {goal.success_criteria ? (
                <View style={{ marginBottom: goal.milestones?.length ? 14 : 0 }}>
                  <Text style={styles.detailLabel}>Criteria</Text>
                  <Text style={[styles.detailValue, { marginTop: 4 }]}>{goal.success_criteria}</Text>
                </View>
              ) : null}

              {Array.isArray(goal.milestones) && goal.milestones.length > 0 ? (
                <View style={{ gap: 10 }}>
                  <Text style={styles.detailLabel}>Milestones</Text>
                  {goal.milestones.map((milestone, index) => (
                    <View key={index} style={styles.milestoneItem}>
                      <View style={styles.milestoneNumber}>
                        <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.milestoneText}>
                        {typeof milestone === 'string' ? milestone : String(milestone)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>Progress</Text>
              {progressPhotos.length > 0 ? (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{progressPhotos.length}</Text>
                </View>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={DARK} />
                <Text style={styles.loadingText}>Loading updates…</Text>
              </View>
            ) : progressPhotos.length > 0 ? (
              <View style={styles.updatesList}>
                {progressPhotos.map((photo, index) => (
                  <View
                    key={photo.id}
                    style={[
                      styles.updateItem,
                      index === progressPhotos.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 },
                    ]}
                  >
                    <View style={styles.updateTextContainer}>
                      <Text style={styles.updateDate}>
                        {photo.check_in_date
                          ? new Date(photo.check_in_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : new Date(photo.date_uploaded).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                      </Text>
                      {photo.note ? <Text style={styles.updateBody}>{photo.note}</Text> : null}
                    </View>

                    {photo.photo_url && photo.photo_url !== 'no-photo' ? (
                      <View style={styles.updateImageContainer}>
                        <Image source={{ uri: photo.photo_url }} style={styles.updateImage} />
                        <TouchableOpacity
                          style={styles.updateDeleteButton}
                          onPress={() => handleDeleteCheckIn(photo)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.textDeleteBtn}
                        onPress={() => handleDeleteCheckIn(photo)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="document-text-outline" size={22} color={DARK} />
                </View>
                <Text style={styles.emptyTitle}>No updates yet</Text>
                <Text style={styles.emptySubtitle}>Post your first check-in above</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  headerSpacer: { width: 36 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countPill: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  countPillText: { fontSize: 12, fontWeight: '700', color: DARK },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIcon: { fontSize: 24 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 20, fontWeight: '800', color: DARK },
  goalCategory: { marginTop: 2, fontSize: 13, fontWeight: '600', color: '#6B7280' },
  goalDescription: { marginTop: 12, fontSize: 14, fontWeight: '500', color: '#374151', lineHeight: 20 },
  updateInput: {
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    marginBottom: 12,
  },
  imagePreviewContainer: { position: 'relative', marginBottom: 12 },
  imagePreview: { width: '100%', height: 180, borderRadius: 14, backgroundColor: '#F3F4F6' },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryChipActive: { backgroundColor: DARK, borderColor: DARK },
  secondaryChipText: { fontSize: 13, fontWeight: '700', color: DARK },
  secondaryChipTextActive: { color: '#FFFFFF' },
  primaryBtn: {
    backgroundColor: DARK,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailTile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.2 },
  detailValue: { marginTop: 4, fontSize: 14, fontWeight: '700', color: DARK },
  frequencyDays: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  frequencyDay: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyDayActive: { backgroundColor: DARK, borderColor: DARK },
  frequencyDayText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  frequencyDayTextActive: { color: '#FFFFFF' },
  milestoneItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  milestoneNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  milestoneNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  milestoneText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151', lineHeight: 20 },
  loadingContainer: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  updatesList: { marginTop: 4 },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  updateTextContainer: { flex: 1 },
  updateDate: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  updateBody: { fontSize: 14, fontWeight: '500', color: DARK, lineHeight: 20 },
  updateImageContainer: { position: 'relative' },
  updateImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F4F6' },
  updateDeleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(17,24,39,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDeleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 22 },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: DARK },
  emptySubtitle: { marginTop: 4, fontSize: 13, fontWeight: '500', color: '#6B7280' },
});
