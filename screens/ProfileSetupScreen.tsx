import React, { useState } from 'react';
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

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);
    try {
      // Update the user profile
      const { error } = await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUri || undefined,
      });

      if (error) {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
        return;
      }

      // Also ensure the profile exists in the profiles table
      const { user } = useAuthStore.getState();
      if (user) {
        await socialService.createProfile(user.id, {
          username: username.trim(),
          display_name: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUri || undefined,
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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