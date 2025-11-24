import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../state/authStore';
import { supabase } from '../lib/supabase';
import { useTheme } from '../state/themeStore';

interface AchievementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string, photoUrl: string) => Promise<void>;
}

export default function AchievementModal({ visible, onClose, onSave }: AchievementModalProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setText('');
    setPhotoUri(null);
    setUploadedPhotoUrl(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to upload photos.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadPhoto = async (uri: string): Promise<void> => {
    if (!user) return;

    setUploading(true);
    try {
      const fileExt = 'jpg';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/achievements/${uniqueFileName}`;

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
        Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
        setPhotoUri(null);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('users')
        .getPublicUrl(data.path);

      setUploadedPhotoUrl(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
      setPhotoUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Text Required', 'Please enter achievement text.');
      return;
    }

    setSaving(true);
    try {
      await onSave(text.trim(), uploadedPhotoUrl || '');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving achievement:', error);
      Alert.alert('Error', 'Failed to save achievement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = text.trim().length > 0 && !saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.modalTitle}>Add Achievement</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Text Input */}
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Achievement Description</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="Describe your achievement..."
                  placeholderTextColor={theme.textSecondary}
                  value={text}
                  onChangeText={setText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Photo Upload Section */}
              <View style={styles.photoSection}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Photo Proof (Optional)</Text>
                {photoUri ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoUri }} style={styles.previewImage} />
                    {uploading && (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => {
                        setPhotoUri(null);
                        setUploadedPhotoUrl(null);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtons}>
                    <TouchableOpacity
                      style={[styles.photoButton, { backgroundColor: theme.primary }]}
                      onPress={takePhoto}
                    >
                      <Ionicons name="camera" size={20} color="#ffffff" />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.photoButton, { backgroundColor: theme.primary }]}
                      onPress={selectFromGallery}
                    >
                      <Ionicons name="images" size={20} color="#ffffff" />
                      <Text style={styles.photoButtonText}>From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: canSave ? theme.primary : theme.border },
                  ]}
                  onPress={handleSave}
                  disabled={!canSave}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.saveButtonText,
                      { color: canSave ? '#ffffff' : theme.textSecondary }
                    ]}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 14,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

