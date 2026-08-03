import React, { useEffect, useRef, useState } from 'react';
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
  TextInput,
  findNodeHandle,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../state/authStore';
import { ChallengeSubmissionModalProps } from '../types/challenges';
import { getChallengeDisplayTitle, challengeAllowsGalleryProofUpload } from '../lib/challengeTitleUtils';
import { moderationAlertMessage, uploadMediaSafely } from '../lib/safeMediaUpload';
import CustomCamera from './CustomCamera';
import CustomBackground from './CustomBackground';

const DARK = '#1f2937';
const MUTED = '#6B7280';
const PAGE_BG = '#F8F9FB';
const BORDER = '#E5E7EB';

/** Upload a local image URI to Supabase Storage, moderate it, and return the public URL. */
async function uploadProofPhoto(localUri: string, userId: string, challengeId: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
  const fileName = `proof_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${userId}/challenge-proofs/${challengeId}/${fileName}`;

  return uploadMediaSafely({
    uri: localUri,
    path: filePath,
    contentType: mime,
    fileName,
    mediaType: 'image',
  });
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
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const allowsGalleryProof = challengeAllowsGalleryProofUpload(challenge.title);
  const scrollRef = useRef<ScrollView>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSelectedImage(existingSubmission?.photo_url || null);
    setSubmissionNotes(existingSubmission?.submission_notes || '');
    setShareToCommunity(false);
    setShowCamera(false);
  }, [visible, existingSubmission?.photo_url, existingSubmission?.submission_notes]);

  const scrollFocusedInputIntoView = (
    event: NativeSyntheticEvent<TextInputFocusEventData>
  ) => {
    const nodeHandle = findNodeHandle(event.target);
    if (nodeHandle == null) return;

    setTimeout(() => {
      const responder = (scrollRef.current as any)?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(nodeHandle, 180, true);
    }, 280);
  };

  const handleImagePicker = async () => {
    if (!allowsGalleryProof) {
      Alert.alert(
        'Camera only',
        'This challenge requires a live photo taken with the camera. Gallery uploads are not allowed.'
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

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

  const handleCameraCapture = () => {
    setShowCamera(true);
  };

  const handleChangePhoto = () => {
    if (allowsGalleryProof) {
      Alert.alert('Change photo', 'How would you like to change the photo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: handleCameraCapture },
        { text: 'Gallery', onPress: handleImagePicker },
      ]);
      return;
    }
    handleCameraCapture();
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('Missing photo', 'Please take a photo as proof.');
      return;
    }

    try {
      setUploading(true);

      let photoUrl = selectedImage;
      const isRemoteUrl = /^https?:\/\//i.test(selectedImage);
      if (!isRemoteUrl) {
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
      Alert.alert('Upload blocked', moderationAlertMessage(error));
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

  const title = getChallengeDisplayTitle(challenge.title);
  const isReplace = !!existingSubmission;

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

      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isReplace ? 'Replace proof' : 'Submit proof'}</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
          >
              <View style={styles.hero}>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroSupport}>
                  {isReplace
                    ? allowsGalleryProof
                      ? 'Replace today’s proof with a new photo or screenshot.'
                      : 'Replace today’s proof with a new live camera photo.'
                    : allowsGalleryProof
                      ? 'Add a photo or screenshot as proof for this challenge.'
                      : 'Take a live camera photo as proof for this challenge.'}
                </Text>
                <Text style={styles.weekChip}>Week {weekNumber}</Text>
              </View>

              <Text style={styles.sectionLabel}>Proof photo</Text>
              <View style={styles.card}>
                {selectedImage ? (
                  <View style={styles.imageWrap}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.selectedImage}
                      contentFit="cover"
                      transition={0}
                      recyclingKey={selectedImage}
                    />
                    <TouchableOpacity
                      style={styles.changePhotoButton}
                      onPress={handleChangePhoto}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="camera-outline" size={18} color={DARK} />
                      <Text style={styles.changePhotoText}>Change photo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyPhoto}>
                    <View style={styles.emptyPhotoIcon}>
                      <Ionicons name="camera-outline" size={28} color={DARK} />
                    </View>
                    <Text style={styles.emptyPhotoTitle}>No photo yet</Text>
                    <Text style={styles.emptyPhotoSupport}>
                      {allowsGalleryProof
                        ? 'Take a live photo or choose one from your gallery.'
                        : 'This challenge only accepts a live camera photo.'}
                    </Text>
                    <View style={styles.photoActions}>
                      <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={handleCameraCapture}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="camera" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Take photo</Text>
                      </TouchableOpacity>
                      {allowsGalleryProof ? (
                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={handleImagePicker}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="images-outline" size={18} color={DARK} />
                          <Text style={styles.secondaryActionText}>Gallery</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.card}>
                <Text style={styles.fieldHint}>Optional — add context for your submission</Text>
                <TextInput
                  value={submissionNotes}
                  onChangeText={setSubmissionNotes}
                  placeholder="How did it go?"
                  placeholderTextColor="#9CA3AF"
                  style={styles.notesInput}
                  multiline
                  textAlignVertical="top"
                  maxLength={400}
                  autoCapitalize="sentences"
                  autoCorrect
                  spellCheck
                  onFocus={scrollFocusedInputIntoView}
                />
                <Text style={styles.charCount}>{submissionNotes.length}/400</Text>
              </View>

              <Text style={styles.sectionLabel}>Sharing</Text>
              <TouchableOpacity
                style={[styles.shareRow, shareToCommunity && styles.shareRowSelected]}
                onPress={() => setShareToCommunity((v) => !v)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, shareToCommunity && styles.checkboxSelected]}>
                  {shareToCommunity ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <View style={styles.shareCopy}>
                  <Text style={styles.shareTitle}>Also post to community</Text>
                  <Text style={styles.shareSubtitle}>
                    Share this proof on the feed, tagged to this challenge.
                  </Text>
                </View>
              </TouchableOpacity>

              {challenge.requirements?.length ? (
                <>
                  <Text style={styles.sectionLabel}>This week’s requirements</Text>
                  <View style={styles.card}>
                    {challenge.requirements.map((requirement, index) => (
                      <View
                        key={requirement.id}
                        style={[
                          styles.requirementRow,
                          index < challenge.requirements.length - 1 && styles.requirementDivider,
                        ]}
                      >
                        <View style={styles.requirementIndex}>
                          <Text style={styles.requirementIndexText}>{index + 1}</Text>
                        </View>
                        <View style={styles.requirementCopy}>
                          <Text style={styles.requirementText}>{requirement.requirement_text}</Text>
                          <Text style={styles.requirementMeta}>
                            {requirement.frequency} · {requirement.target_count}×
                            {requirement.max_submissions_per_period
                              ? ` · max ${requirement.max_submissions_per_period} photo${
                                  requirement.max_submissions_per_period > 1 ? 's' : ''
                                }/${requirement.frequency === 'daily' ? 'day' : 'week'}`
                              : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedImage || uploading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedImage || uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {isReplace ? 'Update proof' : 'Submit proof'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CustomBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 20,
    marginTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroSupport: {
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    marginBottom: 12,
  },
  weekChip: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.3,
    marginBottom: 10,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 20,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: PAGE_BG,
  },
  selectedImage: {
    width: '100%',
    height: 240,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  emptyPhoto: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyPhotoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyPhotoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  emptyPhotoSupport: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PAGE_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryActionText: {
    color: DARK,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 96,
    fontSize: 15,
    lineHeight: 22,
    color: DARK,
    backgroundColor: PAGE_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  charCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  shareRowSelected: {
    borderColor: DARK,
    backgroundColor: '#FFFFFF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  shareCopy: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 4,
  },
  shareSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  requirementDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  requirementIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  requirementIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  requirementCopy: {
    flex: 1,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 4,
  },
  requirementMeta: {
    fontSize: 13,
    color: MUTED,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
