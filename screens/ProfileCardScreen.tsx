import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import MediaUploadModal from './MediaUploadModal';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileCardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuthStore();
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  
  const [profileData, setProfileData] = useState({
    height: '',
    age: '',
    followings: '',
    completedCompetitions: '',
    wonAwards: ''
  });

  // Load saved profile data when component mounts
  React.useEffect(() => {
    const loadSavedProfileData = async () => {
      try {
        const savedProfileData = await AsyncStorage.getItem('profileData');
        if (savedProfileData) {
          setProfileData(JSON.parse(savedProfileData));
        }
      } catch (error) {
        console.error('Error loading saved profile data:', error);
      }
    };
    
    loadSavedProfileData();
  }, []);

  const handleSave = async () => {
    try {
      // Save profile data to AsyncStorage
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
      
      Alert.alert(
        'Profile Card Updated',
        'Your profile card has been successfully updated!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile card. Please try again.');
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Choose import source:',
      [
        { text: 'Manual Entry', onPress: () => {} },
        { text: 'From File', onPress: () => {} },
        { text: 'From Social Media', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleProfilePictureUpload = async (imageUri: string) => {
    try {
      console.log('Starting profile picture upload with URI:', imageUri);
      
      // Generate unique filename for profile picture
      const fileExt = 'jpg';
      const uniqueFileName = `profile_${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/profile/${uniqueFileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Create FormData for React Native compatibility
      const formData = new FormData();
      
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: uniqueFileName,
      } as any);
      
      // Upload to users storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('users')
        .upload(filePath, formData, {
          contentType: 'image/jpeg',
          upsert: true, // Allow overwriting existing profile pictures
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Error', uploadError.message);
        return;
      }

      console.log('Upload successful, data:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('users')
        .getPublicUrl(uploadData.path);

      console.log('Public URL:', urlData.publicUrl);

      // Update user profile with new avatar URL
      const { error: updateError } = await updateProfile({
        username: user?.username || '',
        bio: user?.bio || '',
        avatar_url: urlData.publicUrl
      });

      if (updateError) {
        console.error('Profile update error:', updateError);
        Alert.alert('Profile Update Error', updateError.message);
        return;
      }

      console.log('Profile updated successfully with URL:', urlData.publicUrl);
      setShowMediaUpload(false);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile Card</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: theme.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile Photo</Text>
          <TouchableOpacity 
            style={[styles.importButton, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}
            onPress={() => setShowMediaUpload(true)}
          >
            <Ionicons name="camera-outline" size={24} color={theme.primary} />
            <Text style={[styles.importButtonText, { color: theme.primary }]}>Change Profile Photo</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Import Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Import Data</Text>
          <TouchableOpacity 
            style={[styles.importButton, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}
            onPress={handleImportData}
          >
            <Ionicons name="download-outline" size={24} color={theme.primary} />
            <Text style={[styles.importButtonText, { color: theme.primary }]}>Import Profile Data</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Data Fields */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile Information</Text>
          
          {/* Height */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Height</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="e.g., 5'10&quot; or 178 cm"
              placeholderTextColor={theme.textTertiary}
              value={profileData.height}
              onChangeText={(text) => setProfileData({ ...profileData, height: text })}
            />
          </View>

          {/* Age */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Age</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="e.g., 25"
              placeholderTextColor={theme.textTertiary}
              value={profileData.age}
              onChangeText={(text) => setProfileData({ ...profileData, age: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Followings */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Following Count</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="e.g., 150"
              placeholderTextColor={theme.textTertiary}
              value={profileData.followings}
              onChangeText={(text) => setProfileData({ ...profileData, followings: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Completed Competitions */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Completed Competitions</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="e.g., 5"
              placeholderTextColor={theme.textTertiary}
              value={profileData.completedCompetitions}
              onChangeText={(text) => setProfileData({ ...profileData, completedCompetitions: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Won Awards */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Won Awards</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="e.g., 3"
              placeholderTextColor={theme.textTertiary}
              value={profileData.wonAwards}
              onChangeText={(text) => setProfileData({ ...profileData, wonAwards: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Profile Card Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.previewAvatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: theme.textPrimary }]}>{user?.username || 'Username'}</Text>
                {profileData.age && (
                  <Text style={[styles.previewDetail, { color: theme.textSecondary }]}>Age: {profileData.age}</Text>
                )}
                {profileData.height && (
                  <Text style={[styles.previewDetail, { color: theme.textSecondary }]}>Height: {profileData.height}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.previewStats}>
              {profileData.followings && (
                <View style={styles.previewStat}>
                  <Text style={[styles.previewStatNumber, { color: theme.primary }]}>{profileData.followings}</Text>
                  <Text style={[styles.previewStatLabel, { color: theme.textSecondary }]}>Following</Text>
                </View>
              )}
              {profileData.completedCompetitions && (
                <View style={styles.previewStat}>
                  <Text style={[styles.previewStatNumber, { color: theme.primary }]}>{profileData.completedCompetitions}</Text>
                  <Text style={[styles.previewStatLabel, { color: theme.textSecondary }]}>Competitions</Text>
                </View>
              )}
              {profileData.wonAwards && (
                <View style={styles.previewStat}>
                  <Text style={[styles.previewStatNumber, { color: theme.primary }]}>{profileData.wonAwards}</Text>
                  <Text style={[styles.previewStatLabel, { color: theme.textSecondary }]}>Awards</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Media Upload Modal */}
      <MediaUploadModal
        visible={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onMediaSelected={handleProfilePictureUpload}
        goalTitle="Profile Picture"
      />
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  importButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  previewCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 14,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  previewStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
}); 