import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { Challenge, ChallengeSubmissionModalProps } from '../types/challenges';
import { getChallengeDisplayTitle, challengeAllowsGalleryProofUpload } from '../lib/challengeTitleUtils';
import CustomCamera from './CustomCamera';

/** Upload a local image URI to Supabase Storage and return the public URL. */
async function uploadProofPhoto(localUri: string, userId: string, challengeId: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
  const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${userId}/challenge-proofs/${challengeId}/${fileName}`;

  const formData = new FormData();
  formData.append('file', { uri: localUri, type: mime, name: fileName } as any);

  const { data, error } = await supabase.storage
    .from('users')
    .upload(filePath, formData, { contentType: mime, upsert: false });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from('users').getPublicUrl(data.path);
  return urlData.publicUrl;
}

/** Gallery only — Compatible helps HEIC/orientation from the library. */
function proofLibraryPickerOptions(): ImagePicker.ImagePickerOptions {
  const opts: ImagePicker.ImagePickerOptions = {
    allowsEditing: false,
    quality: 0.92,
  };
  if (Platform.OS === 'ios') {
    opts.preferredAssetRepresentationMode =
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible;
  }
  return opts;
}

export default function ChallengeSubmissionModal({
  visible,
  challenge,
  weekNumber,
  onClose,
  onSubmit,
  existingSubmission,
}: ChallengeSubmissionModalProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const allowsGalleryProof = challengeAllowsGalleryProofUpload(challenge.title);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    existingSubmission?.photo_url || null
  );
  const [submissionNotes, setSubmissionNotes] = useState(
    existingSubmission?.submission_notes || ''
  );
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(false);

  const handleImagePicker = async () => {
    if (!allowsGalleryProof) {
      Alert.alert(
        'Camera only',
        'This challenge requires a live photo taken with the camera. Gallery uploads are not allowed.',
      );
      return;
    }
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        ...proofLibraryPickerOptions(),
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    setShowCamera(true);
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Missing Photo', 'Please select or take a photo to submit as proof.');
      return;
    }

    try {
      setUploading(true);

      let photoUrl = selectedImage;

      // If this is a local file URI (not already a remote URL), upload it to storage
      if (selectedImage.startsWith('file://') || selectedImage.startsWith('/')) {
        if (!user || !challenge) {
          Alert.alert('Error', 'Unable to upload photo. Please try again.');
          return;
        }
        photoUrl = await uploadProofPhoto(selectedImage, user.id, challenge.id);
      }

      await onSubmit(photoUrl, submissionNotes.trim() || undefined, shareToCommunity);
      onClose();
    } catch (error) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', 'Failed to submit proof. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setShowCamera(false);
    setSelectedImage(existingSubmission?.photo_url || null);
    setSubmissionNotes(existingSubmission?.submission_notes || '');
    setShareToCommunity(false);
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
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCamera(false)}
      >
        <CustomCamera
          onPhotoTaken={(uri) => {
            setSelectedImage(uri);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {existingSubmission ? 'Replace Photo' : 'Submit Proof'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Challenge Info */}
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: theme.textPrimary }]}>
              {getChallengeDisplayTitle(challenge.title)}
            </Text>
            <Text style={[styles.weekInfo, { color: theme.textSecondary }]}>
              Week {weekNumber} Submission
            </Text>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Take a photo for proof
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              {existingSubmission
                ? allowsGalleryProof
                  ? "Pick a new photo or screenshot to replace today's submission. Your old proof will be overwritten."
                  : "Take a new live photo with the camera to replace today's submission. Your old proof will be overwritten."
                : allowsGalleryProof
                  ? 'Take a photo or choose a screenshot from your gallery as proof for this challenge.'
                  : 'Use the camera to take a live photo as proof. Gallery uploads are not allowed for this challenge.'}
            </Text>

            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  contentFit="contain"
                  transition={0}
                  recyclingKey={selectedImage}
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => {
                    if (allowsGalleryProof) {
                      Alert.alert(
                        'Change Photo',
                        'How would you like to change the photo?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Camera', onPress: handleCameraCapture },
                          { text: 'Gallery', onPress: handleImagePicker },
                        ]
                      );
                    } else {
                      void handleCameraCapture();
                    }
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
                    style={[
                      styles.imageButton,
                      { backgroundColor: categoryColor },
                      { flex: 1, justifyContent: 'center' },
                    ]}
                    onPress={handleCameraCapture}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>Take live photo</Text>
                  </TouchableOpacity>
                  {allowsGalleryProof && (
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: theme.textSecondary, flex: 1, justifyContent: 'center' }]}
                      onPress={handleImagePicker}
                    >
                      <Ionicons name="images-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.imageButtonText}>Gallery / screenshot</Text>
                    </TouchableOpacity>
                  )}
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

          {/* Share to community */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.shareRow,
                {
                  backgroundColor: shareToCommunity ? '#ECFDF5' : theme.cardBackground,
                  borderColor: shareToCommunity ? '#10B981' : theme.border,
                },
              ]}
              onPress={() => setShareToCommunity((v) => !v)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.shareCheckbox,
                  {
                    backgroundColor: shareToCommunity ? '#10B981' : '#FFFFFF',
                    borderColor: shareToCommunity ? '#10B981' : '#D1D5DB',
                  },
                ]}
              >
                {shareToCommunity ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <View style={styles.shareTextCol}>
                <Text style={[styles.shareTitle, { color: theme.textPrimary }]}>
                  Also post to community feed
                </Text>
                <Text style={[styles.shareSubtitle, { color: theme.textSecondary }]}>
                  Share this proof photo on Community. It will show as posted in this challenge.
                </Text>
              </View>
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
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
  shareRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  shareTextCol: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  shareSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
