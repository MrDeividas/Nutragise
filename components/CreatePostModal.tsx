import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { dailyPostsService, DailyPost } from '../lib/dailyPostsService';
import { progressService } from '../lib/progressService';
import { getDailyPostDate } from '../lib/timeService';
import { useActionStore } from '../state/actionStore';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userGoals?: any[];
  preSelectedGoal?: string;
  targetCheckInDate?: Date; // Add target date for backdating check-ins
}

const habitOptions = [
  { key: 'sleep', label: 'Sleep', icon: 'moon-outline' },
  { key: 'water', label: 'Water', icon: 'water-outline' },
  { key: 'run', label: 'Run', icon: 'walk-outline' },
  { key: 'gym', label: 'Gym', icon: 'barbell-outline' },
  { key: 'reflect', label: 'Reflect', icon: 'bulb-outline' },
  { key: 'cold_shower', label: 'Cold Shower', icon: 'snow-outline' },
];

export default function CreatePostModal({ 
  visible, 
  onClose, 
  onPostCreated,
  userGoals = [],
  preSelectedGoal,
  targetCheckInDate
}: CreatePostModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { trackCoreHabit } = useActionStore();

  // Check for existing daily post when modal opens
  React.useEffect(() => {
    if (visible && user) {
      checkForExistingDailyPost();
      loadCompletedHabits();
    }
  }, [visible, user, targetCheckInDate]); // Add targetCheckInDate as dependency

  // Set pre-selected goal when modal opens
  React.useEffect(() => {
    if (visible && preSelectedGoal) {
      setSelectedGoal(preSelectedGoal);
    }
  }, [visible, preSelectedGoal]);

  // Load user's completed habits for the day
  const loadCompletedHabits = async (): Promise<string[]> => {
    if (!user) return [];
    
    try {
      const dateToCheck = targetCheckInDate || new Date();
      const dailyPostDate = getDailyPostDate(dateToCheck);
      
      // Fetch daily habits
      const { data: dailyHabits, error: habitsError } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dailyPostDate)
        .single();
      
      // Fetch points data for meditation/microlearn
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dailyPostDate)
        .single();
      
      const completedHabits: string[] = [];
      
      if (dailyHabits) {
        // Check if any sleep data exists (hours, quality, bedtime, wakeup)
        if (dailyHabits.sleep_hours || dailyHabits.sleep_quality || dailyHabits.sleep_bedtime_hours || dailyHabits.sleep_wakeup_hours) {
          completedHabits.push('sleep');
        }
        // Check if any water data exists
        if (dailyHabits.water_intake || dailyHabits.water_goal) {
          completedHabits.push('water');
        }
        // Check if run was logged (active day or any run data)
        if (dailyHabits.run_day_type === 'active' || dailyHabits.run_activity_type || dailyHabits.run_distance) {
          completedHabits.push('run');
        }
        // Check if gym was logged (active day or training types)
        if (dailyHabits.gym_day_type === 'active' || (dailyHabits.gym_training_types && dailyHabits.gym_training_types.length > 0)) {
          completedHabits.push('gym');
        }
        // Check if any reflection data exists
        if (dailyHabits.reflect_mood || dailyHabits.reflect_energy || dailyHabits.reflect_what_went_well || dailyHabits.reflect_friction) {
          completedHabits.push('reflect');
        }
        if (dailyHabits.cold_shower_completed) completedHabits.push('cold_shower');
        if (dailyHabits.focus_completed || dailyHabits.focus_duration) completedHabits.push('focus');
      }
      
      if (pointsData) {
        if (pointsData.meditation_completed) completedHabits.push('meditation');
        if (pointsData.microlearn_completed) completedHabits.push('microlearn');
      }
      
      setSelectedHabits(completedHabits);
      return completedHabits;
    } catch (error) {
      console.error('Error loading completed habits:', error);
      return [];
    }
  };

  const checkForExistingDailyPost = async () => {
    if (!user) return;
    
    setCheckingExistingPost(true);
    try {
      // Use targetCheckInDate if provided, otherwise use today
      const dateToCheck = targetCheckInDate || new Date();
      const dailyPostDate = getDailyPostDate(dateToCheck);
      const existing = await dailyPostsService.getDailyPostByDate(user.id, dailyPostDate);
      setExistingDailyPost(existing);
    } catch (error) {
      console.error('Error checking for existing daily post:', error);
    } finally {
      setCheckingExistingPost(false);
    }
  };
  const [content, setContent] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [moodRating, setMoodRating] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [isCreating, setIsCreating] = useState(false);
  const [existingDailyPost, setExistingDailyPost] = useState<DailyPost | null>(null);
  const [checkingExistingPost, setCheckingExistingPost] = useState(false);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [editingCaptionIndex, setEditingCaptionIndex] = useState<number>(-1);

  // Format the target date for display
  const getPostDateString = () => {
    const date = targetCheckInDate || new Date();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    const formatted = date.toLocaleDateString('en-US', options);
    return formatted;
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to let you upload photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (selectedPhotos.length >= 5) {
      Alert.alert('Photo Limit', 'You can only upload up to 5 photos per post.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await handlePhotoTaken(uri);
    }
  };

  const handlePhotoTaken = async (uri: string) => {
    try {
      // Upload photo to Supabase storage
      const photoUrl = await uploadPhotoToStorage(uri);
      if (photoUrl) {
        setSelectedPhotos(prev => [photoUrl, ...prev]); // Add new photo at the beginning (most recent first)
        setPhotoCaptions(prev => ['', ...prev]); // Add empty caption for new photo at the beginning
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    if (selectedPhotos.length >= 5) {
      Alert.alert('Photo Limit', 'You can only upload up to 5 photos per post.');
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload photo to Supabase storage
        const photoUrl = await uploadPhotoToStorage(result.assets[0].uri);
        if (photoUrl) {
          setSelectedPhotos(prev => [photoUrl, ...prev]); // Add new photo at the beginning (most recent first)
          setPhotoCaptions(prev => ['', ...prev]); // Add empty caption for new photo at the beginning
        }
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhotoToStorage = async (uri: string): Promise<string | null> => {
    try {
      if (!user) return null;

      const fileExt = 'jpg';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/posts/${uniqueFileName}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: uniqueFileName,
      } as any);
      
      const { data, error } = await supabase.storage
        .from('users')
        .upload(filePath, formData, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('users')
        .getPublicUrl(data.path);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotoCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const openCaptionModal = (index: number) => {
    setEditingCaptionIndex(index);
    setCaptionModalVisible(true);
  };

  const closeCaptionModal = () => {
    setCaptionModalVisible(false);
    setEditingCaptionIndex(-1);
  };

  const saveCaption = () => {
    closeCaptionModal();
  };

  const toggleHabit = (habitKey: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitKey) 
        ? prev.filter(h => h !== habitKey)
        : [...prev, habitKey]
    );
  };

  const resetForm = () => {
    setContent('');
    setSelectedPhotos([]);
    setPhotoCaptions([]);
    setSelectedHabits([]);
    setSelectedGoal('');
    setMoodRating(3);
    setEnergyLevel(3);
  };

  const createPost = async () => {
    if (selectedPhotos.length === 0 && selectedHabits.length === 0) {
      Alert.alert('Error', 'Please add at least one photo or select a habit.');
      return;
    }

    // If there's an existing daily post, show confirmation
    if (existingDailyPost) {
      Alert.alert(
        'Add to Today\'s Post',
        `You already have a post for today with ${existingDailyPost.total_photos} photos and ${existingDailyPost.total_habits} habits. Add this content to your existing daily post?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Today\'s Post', onPress: () => submitPost() }
        ]
      );
    } else {
      submitPost();
    }
  };

  const submitPost = async () => {
    setIsCreating(true);
    try {
      // Fetch latest completed habits right before saving
      const latestHabits = await loadCompletedHabits();
      
      const dailyPostData = {
        photos: selectedPhotos,
        captions: photoCaptions,
        habits_completed: latestHabits, // Use freshly loaded habits
      };

      let result;
      if (existingDailyPost) {
        // Add to existing daily post
        result = await dailyPostsService.addToDailyPost(existingDailyPost.id, dailyPostData);
      } else {
        // Create new daily post
        // Use targetCheckInDate if provided, otherwise use today
        const dateToUse = targetCheckInDate || new Date();
        const dailyPostDate = getDailyPostDate(dateToUse);
        result = await dailyPostsService.createDailyPost(user!.id, dailyPostDate, dailyPostData);
      }
      
      if (result) {
        // If a goal is selected and photos are uploaded, also create progress_photos entries
        if (selectedGoal && selectedPhotos.length > 0) {
          try {
            // Create progress_photos entries for GoalDetailScreen
            for (const photoUrl of selectedPhotos) {
              const checkInResult = await progressService.createCheckIn({
                goalId: selectedGoal,
                userId: user!.id,
                photoUri: photoUrl, // Use the same URL - no duplication
                checkInDate: targetCheckInDate || new Date() // Use target date if provided, otherwise today
              });
            }
          } catch (error) {
            console.error('Error creating progress photos entries:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            // Don't fail the entire operation if progress photos creation fails
          }
        }

        const actionText = existingDailyPost ? 'added to today\'s post' : 'created';
        Alert.alert('Success', `Content ${actionText} successfully with ${selectedPhotos.length} photo(s) and ${selectedHabits.length} habit(s)!`);
        
        // Track core habits
        // Note: Share is tracked when user clicks share button, not when creating post
        
        // If a goal was selected and photos were uploaded, track update_goal
        if (selectedGoal && selectedPhotos.length > 0) {
          trackCoreHabit('update_goal');
        }
        
        resetForm();
        onPostCreated();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in submitPost:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.borderSecondary }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {targetCheckInDate ? `${getPostDateString()} Post` : 'Create Post'}
          </Text>
          <TouchableOpacity 
            onPress={createPost} 
            style={[styles.postButton, { opacity: isCreating ? 0.5 : 1 }]}
            disabled={isCreating}
          >
            <Text style={[styles.postButtonText, { color: theme.primary }]}>
              {isCreating ? 'Creating...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing Daily Post Preview */}
        {existingDailyPost && (
          <View style={[styles.existingPostPreview, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
            <View style={styles.existingPostHeader}>
              <Ionicons name="today" size={20} color={theme.primary} />
              <Text style={[styles.existingPostTitle, { color: theme.textPrimary }]}>
                {targetCheckInDate ? `${getPostDateString()}'s Post` : "Today's Post"}
              </Text>
            </View>
            <Text style={[styles.existingPostInfo, { color: theme.textSecondary }]}>
              {existingDailyPost.total_photos} photos • {existingDailyPost.total_habits} habits • {existingDailyPost.post_count} posts
            </Text>
            {existingDailyPost.captions.length > 0 && (
              <Text style={[styles.existingPostCaption, { color: theme.textSecondary }]} numberOfLines={2}>
                "{existingDailyPost.captions[existingDailyPost.captions.length - 1]}"
              </Text>
            )}
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Photo Upload */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Photos ({selectedPhotos.length}/5)
            </Text>
            
            {/* Photo Upload Buttons */}
            {selectedPhotos.length < 5 && (
              <View style={styles.photoUploadButtons}>
                <TouchableOpacity 
                  style={[styles.uploadButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color={theme.textSecondary} />
                  <Text style={[styles.uploadButtonText, { color: theme.textSecondary }]}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.uploadButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
                  onPress={selectFromGallery}
                >
                  <Ionicons name="images" size={24} color={theme.textSecondary} />
                  <Text style={[styles.uploadButtonText, { color: theme.textSecondary }]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Photos */}
            {selectedPhotos.length > 0 && (
              <View style={styles.selectedPhotos}>
                {selectedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoWithCaptionContainer}>
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      style={styles.captionButton}
                      onPress={() => openCaptionModal(index)}
                    >
                      {photoCaptions[index] ? (
                        <Text style={[styles.captionText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                          {photoCaptions[index]}
                        </Text>
                      ) : (
                        <Text style={[styles.captionPlaceholder, { color: theme.textSecondary }]}>
                          Add caption...
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>



          {/* Habit Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Habits Completed ({selectedHabits.length})
            </Text>
            <View style={styles.habitsGrid}>
              {habitOptions.map(habit => (
                <TouchableOpacity
                  key={habit.key}
                  style={[
                    styles.habitButton,
                    { 
                      backgroundColor: selectedHabits.includes(habit.key) 
                        ? theme.primary 
                        : theme.cardBackground,
                      borderColor: theme.borderSecondary
                    }
                  ]}
                  onPress={() => toggleHabit(habit.key)}
                >
                  <Ionicons 
                    name={habit.icon as any} 
                    size={20} 
                    color={selectedHabits.includes(habit.key) ? '#ffffff' : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.habitButtonText,
                    { color: selectedHabits.includes(habit.key) ? '#ffffff' : theme.textSecondary }
                  ]}>
                    {habit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Selection */}
          {userGoals && userGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Link to Goal (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.goalsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.goalButton,
                      { 
                        backgroundColor: selectedGoal === '' ? theme.primary : theme.cardBackground,
                        borderColor: theme.borderSecondary
                      }
                    ]}
                    onPress={() => setSelectedGoal('')}
                  >
                    <Text style={[
                      styles.goalButtonText,
                      { color: selectedGoal === '' ? '#ffffff' : theme.textSecondary }
                    ]}>
                      No Goal
                    </Text>
                  </TouchableOpacity>
                  
                  {userGoals.map(goal => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.goalButton,
                        { 
                          backgroundColor: selectedGoal === goal.id ? theme.primary : theme.cardBackground,
                          borderColor: theme.borderSecondary
                        }
                      ]}
                      onPress={() => setSelectedGoal(goal.id)}
                    >
                      <Text style={[
                        styles.goalButtonText,
                        { color: selectedGoal === goal.id ? '#ffffff' : theme.textSecondary }
                      ]}>
                        {goal.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Mood & Energy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>How are you feeling?</Text>
            
            <View style={styles.moodEnergyContainer}>
              <View style={styles.moodEnergyItem}>
                <Text style={[styles.moodEnergyLabel, { color: theme.textSecondary }]}>Mood</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        { 
                          backgroundColor: moodRating >= rating ? theme.primary : theme.cardBackground,
                          borderColor: theme.borderSecondary
                        }
                      ]}
                      onPress={() => setMoodRating(rating)}
                    >
                      <Text style={[
                        styles.ratingText,
                        { color: moodRating >= rating ? '#ffffff' : theme.textSecondary }
                      ]}>
                        {rating}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.moodEnergyItem}>
                <Text style={[styles.moodEnergyLabel, { color: theme.textSecondary }]}>Energy</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        { 
                          backgroundColor: energyLevel >= rating ? theme.primary : theme.cardBackground,
                          borderColor: theme.borderSecondary
                        }
                      ]}
                      onPress={() => setEnergyLevel(rating)}
                    >
                      <Text style={[
                        styles.ratingText,
                        { color: energyLevel >= rating ? '#ffffff' : theme.textSecondary }
                      ]}>
                        {rating}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Caption Modal */}
      <Modal
        visible={captionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCaptionModal}
      >
        <View style={styles.captionModalOverlay}>
          <View style={styles.captionModalContainer}>
            <TextInput
              style={[styles.captionModalInput, { 
                backgroundColor: theme.cardBackground, 
                color: theme.textPrimary,
                borderColor: theme.borderSecondary 
              }]}
              placeholder="Write a caption..."
              placeholderTextColor={theme.textSecondary}
              value={editingCaptionIndex >= 0 ? photoCaptions[editingCaptionIndex] || '' : ''}
              onChangeText={(text) => updatePhotoCaption(editingCaptionIndex, text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.captionModalButtons}>
              <TouchableOpacity 
                style={[styles.captionModalButton, { backgroundColor: theme.cardBackground }]}
                onPress={closeCaptionModal}
              >
                <Text style={[styles.captionModalButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.captionModalButton, { backgroundColor: theme.primary }]}
                onPress={saveCaption}
              >
                <Text style={[styles.captionModalButtonText, { color: '#ffffff' }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Camera Modal */}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    padding: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  photoUploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPhotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    position: 'relative',
  },
  photoWithCaptionContainer: {
    gap: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  photoCaptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    minHeight: 40,
  },
  captionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  captionText: {
    fontSize: 12,
    fontWeight: '400',
    maxWidth: 80, // Match photo width
  },
  captionPlaceholder: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  captionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionModalContainer: {
    width: '90%',
    maxWidth: 400,
    gap: 16,
  },
  captionModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
  },
  captionModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  captionModalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  captionModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 60,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  habitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  habitButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodEnergyContainer: {
    gap: 16,
  },
  moodEnergyItem: {
    gap: 8,
  },
  moodEnergyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  existingPostPreview: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  existingPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  existingPostTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  existingPostInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  existingPostCaption: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
