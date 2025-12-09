import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../state/themeStore';
import { Challenge, ChallengeSubmissionModalProps } from '../types/challenges';

export default function ChallengeSubmissionModal({
  visible,
  challenge,
  weekNumber,
  onClose,
  onSubmit,
  existingSubmission,
}: ChallengeSubmissionModalProps) {
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(
    existingSubmission?.photo_url || null
  );
  const [submissionNotes, setSubmissionNotes] = useState(
    existingSubmission?.submission_notes || ''
  );
  const [uploading, setUploading] = useState(false);

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        presentationStyle: 'fullScreen',
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Missing Photo', 'Please select or take a photo to submit as proof.');
      return;
    }

    try {
      setUploading(true);
      
      // TODO: Upload image to Supabase Storage
      // For now, we'll use the local URI
      const photoUrl = selectedImage;
      
      await onSubmit(photoUrl, submissionNotes.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', 'Failed to submit proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(existingSubmission?.photo_url || null);
    setSubmissionNotes(existingSubmission?.submission_notes || '');
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fitness':
        return '#10B981';
      case 'wellness':
        return '#8B5CF6';
      case 'nutrition':
        return '#F59E0B';
      case 'mindfulness':
        return '#06B6D4';
      case 'learning':
        return '#EF4444';
      case 'creativity':
        return '#EC4899';
      case 'productivity':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const categoryColor = getCategoryColor(challenge.category);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Submit Proof
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Challenge Info */}
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
              {challenge.title}
            </Text>
            <Text style={[styles.weekInfo, { color: theme.textSecondary }]}>
              Week {weekNumber} Submission
            </Text>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Upload Photo Proof
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Take a photo or select from your gallery as proof of completing this week's requirements.
            </Text>

            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => {
                    Alert.alert(
                      'Change Photo',
                      'How would you like to change the photo?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Camera', onPress: handleCameraCapture },
                        { text: 'Gallery', onPress: handleImagePicker },
                      ]
                    );
                  }}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  No photo selected
                </Text>
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: categoryColor }]}
                    onPress={handleCameraCapture}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: theme.textSecondary }]}
                    onPress={handleImagePicker}
                  >
                    <Ionicons name="images-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Additional Notes (Optional)
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Add any additional context about your submission.
            </Text>
            
            <View style={[styles.notesContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[styles.notesPlaceholder, { color: theme.textSecondary }]}>
                {submissionNotes || 'Add notes about your submission...'}
              </Text>
            </View>
          </View>

          {/* Requirements Reminder */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              This Week's Requirements
            </Text>
            {challenge.requirements.map((requirement, index) => (
              <View key={requirement.id} style={[styles.requirementItem, { backgroundColor: theme.cardBackground }]}>
                <View style={[styles.requirementNumber, { backgroundColor: categoryColor }]}>
                  <Text style={styles.requirementNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.requirementContent}>
                  <Text style={[styles.requirementText, { color: theme.textPrimary }]}>
                    {requirement.requirement_text}
                  </Text>
                  <Text style={[styles.requirementFrequency, { color: theme.textSecondary }]}>
                    {requirement.frequency} • {requirement.target_count} times
                    {requirement.max_submissions_per_period && (
                      <Text style={[styles.submissionLimit, { color: categoryColor }]}>
                        {' '}• Max {requirement.max_submissions_per_period} photo{requirement.max_submissions_per_period > 1 ? 's' : ''} per {requirement.frequency === 'daily' ? 'day' : 'week'}
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={[styles.bottomAction, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: selectedImage ? categoryColor : theme.textSecondary,
                opacity: uploading ? 0.7 : 1,
              }
            ]}
            onPress={handleSubmit}
            disabled={!selectedImage || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {existingSubmission ? 'Update Submission' : 'Submit Proof'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  challengeInfo: {
    padding: 20,
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  weekInfo: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
  },
  notesPlaceholder: {
    fontSize: 16,
    lineHeight: 22,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  requirementNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requirementNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  requirementFrequency: {
    fontSize: 14,
  },
  submissionLimit: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomAction: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
