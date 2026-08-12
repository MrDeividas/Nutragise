import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import { socialService } from '../lib/socialService';
import { supabase } from '../lib/supabase';
import { moderationAlertMessage, uploadMediaSafely } from '../lib/safeMediaUpload';
import CustomBackground from '../components/CustomBackground';

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const finishingRef = React.useRef(false);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const enterMainApp = () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    useAuthStore.getState().notifyOnboardingFinished();
  };

  // Check on mount if user already has profile and onboarding is complete - skip if so
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user || finishingRef.current) return;

      try {
        const [profileResult, userResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, display_name, onboarding_completed')
            .eq('id', user.id)
            .single(),
          supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single()
        ]);

        const profileData = profileResult.data;
        const userData = userResult.data;
        const existingUsername = profileData?.username || userData?.username;

        // Check if username exists and is not just a UUID or email prefix
        const hasRealUsername = existingUsername && 
                               existingUsername !== user.id &&
                               existingUsername !== user.email?.split('@')[0];

        // Already set up — enter main app. Do NOT goBack(): this screen is often
        // the only route in OnboardingStack (navigation.replace), so GO_BACK fails.
        if (profileData?.onboarding_completed && hasRealUsername) {
          console.log('✅ Profile already set up and onboarding complete, entering app');
          enterMainApp();
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
        // Continue with profile setup if check fails
      }
    };

    checkExistingProfile();
  }, [user]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (imageUri: string, userId: string): Promise<string | null> => {
    const fileExt = 'jpg';
    const uniqueFileName = `profile_${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/profile/${uniqueFileName}`;

    return uploadMediaSafely({
      uri: imageUri,
      path: filePath,
      contentType: 'image/jpeg',
      fileName: uniqueFileName,
      upsert: true,
      mediaType: 'image',
    });
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        Alert.alert('Error', 'No user found. Please sign in again.');
        setLoading(false);
        return;
      }

      // Upload avatar to storage if one is selected
      let avatarUrl: string | undefined = undefined;
      if (avatarUri) {
        console.log('📤 Uploading avatar to storage...');
        avatarUrl = await uploadAvatar(avatarUri, user.id);
        if (!avatarUrl) {
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
          setLoading(false);
          return;
        }
        console.log('✅ Avatar uploaded:', avatarUrl);
      }

      // Update the user profile (this already handles both users and profiles tables)
      const { error } = await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });

      if (error) {
        console.error('❌ Update profile error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        Alert.alert('Error', `Failed to save profile: ${error.message || 'Unknown error'}. Please try again.`);
        setLoading(false);
        return;
      }

      // Mark onboarding as complete when profile is saved
      // This allows users who exited onboarding early to still use the app
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_last_step')
        .eq('id', user.id)
        .single();

      if (!fetchError && profileData && !profileData.onboarding_completed) {
        // Mark onboarding as complete so user can access the app
        const { error: onboardingError } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_last_step: null,
          })
          .eq('id', user.id);

        if (onboardingError) {
          console.error('❌ Error marking onboarding complete:', onboardingError);
          // Don't fail the whole operation - profile was saved successfully
        } else {
          console.log('✅ Marked onboarding as complete (profile setup finished)');
        }
      }

      // Enter main app immediately (don't wait on alert / don't goBack)
      enterMainApp();
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Upload blocked', moderationAlertMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Complete Your Profile</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Tell us a bit about yourself to get started
              </Text>
            </View>

            <View style={styles.form}>
              {/* Avatar Upload */}
              <View style={styles.avatarSection}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Profile Photo</Text>
                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { 
                      backgroundColor: 'rgba(128, 128, 128, 0.3)',
                      borderColor: theme.borderSecondary
                    }]}>
                      <Ionicons name="add" size={32} color={theme.textSecondary} />
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>Tap to add photo</Text>
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Username</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: 'rgba(128, 128, 128, 0.15)',
                    color: theme.textPrimary,
                    borderColor: theme.borderSecondary
                  }]}
                  placeholder="Choose a username"
                  placeholderTextColor={theme.textTertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Bio (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.bioInput, { 
                    backgroundColor: 'rgba(128, 128, 128, 0.15)',
                    color: theme.textPrimary,
                    borderColor: theme.borderSecondary
                  }]}
                  placeholder="Tell us about your health goals..."
                  placeholderTextColor={theme.textTertiary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: loading ? 'rgba(128, 128, 128, 0.3)' : theme.primary }
                ]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Complete Setup</Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  avatarHint: {
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 80,
    paddingTop: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
}); 