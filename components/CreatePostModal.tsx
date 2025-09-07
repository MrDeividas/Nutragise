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
import { postsService } from '../lib/postsService';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userGoals?: any[];
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
  userGoals = []
}: CreatePostModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [moodRating, setMoodRating] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [isCreating, setIsCreating] = useState(false);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [editingCaptionIndex, setEditingCaptionIndex] = useState<number>(-1);

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

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload photo to Supabase storage
        const photoUrl = await uploadPhotoToStorage(result.assets[0].uri);
        if (photoUrl) {
          setSelectedPhotos(prev => [...prev, photoUrl]);
          setPhotoCaptions(prev => [...prev, '']); // Add empty caption for new photo
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload photo to Supabase storage
        const photoUrl = await uploadPhotoToStorage(result.assets[0].uri);
        if (photoUrl) {
          setSelectedPhotos(prev => [...prev, photoUrl]);
          setPhotoCaptions(prev => [...prev, '']); // Add empty caption for new photo
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

    setIsCreating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const postData = {
        content: '', // Empty content since we removed the text box
        goal_id: selectedGoal || undefined,
        date: today,
        photos: selectedPhotos,
        habits_completed: selectedHabits,
        caption: photoCaptions.join(' | '), // Combine all captions
        mood_rating: moodRating,
        energy_level: energyLevel,
        is_public: true,
      };

      const result = await postsService.createPost(postData);
      
      if (result) {
        Alert.alert('Success', `Post created successfully with ${selectedPhotos.length} photo(s) and ${selectedHabits.length} habit(s)!`);
        resetForm();
        onPostCreated();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error: any) {
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
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Create Post (Test)</Text>
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
});
