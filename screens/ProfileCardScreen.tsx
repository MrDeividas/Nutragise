import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import MediaUploadModal from './MediaUploadModal';
import { moderationAlertMessage, uploadMediaSafely } from '../lib/safeMediaUpload';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK = '#1f2937';
const CARD_BORDER = '#EEF0F3';
const PROFILE_DATA_KEY = 'profileData';

type ProfileCardData = {
  height: string;
  age: string;
  followings: string;
  completedCompetitions: string;
  wonAwards: string;
};

const EMPTY: ProfileCardData = {
  height: '',
  age: '',
  followings: '',
  completedCompetitions: '',
  wonAwards: '',
};

export default function ProfileCardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileCardData>(EMPTY);

  useEffect(() => {
    const loadSavedProfileData = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROFILE_DATA_KEY);
        if (saved) setProfileData({ ...EMPTY, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Error loading saved profile data:', error);
      }
    };
    loadSavedProfileData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
      Alert.alert('Saved', 'Your profile card has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to update profile card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (imageUri: string) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Please sign in again.');
        return;
      }
      setUploading(true);
      const uniqueFileName = `profile_${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const filePath = `${user.id}/profile/${uniqueFileName}`;
      const publicUrl = await uploadMediaSafely({
        uri: imageUri,
        path: filePath,
        contentType: 'image/jpeg',
        fileName: uniqueFileName,
        upsert: true,
        mediaType: 'image',
      });

      const { error: updateError } = await updateProfile({
        username: user?.username || '',
        bio: user?.bio || '',
        avatar_url: publicUrl,
      });
      if (updateError) {
        Alert.alert('Profile Update Error', updateError.message);
        return;
      }
      setShowMediaUpload(false);
      Alert.alert('Success', 'Profile photo updated.');
    } catch (error) {
      Alert.alert('Upload blocked', moderationAlertMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const displayName = user?.username || 'You';
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar_url;

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile card</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 28 + bottomNavPadding }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.previewCard}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => setShowMediaUpload(true)}
              activeOpacity={0.85}
              disabled={uploading}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <Text style={[styles.previewName, { color: theme.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            {(profileData.age || profileData.height) && (
              <Text style={[styles.previewMeta, { color: theme.textSecondary }]}>
                {[profileData.age && `${profileData.age} yrs`, profileData.height]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{profileData.followings || '—'}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{profileData.completedCompetitions || '—'}</Text>
                <Text style={styles.statLabel}>Competitions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{profileData.wonAwards || '—'}</Text>
                <Text style={styles.statLabel}>Awards</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Details</Text>
          <View style={styles.formCard}>
            {(
              [
                { key: 'age', label: 'Age', placeholder: 'e.g. 25', keyboard: 'numeric' as const },
                {
                  key: 'height',
                  label: 'Height',
                  placeholder: 'e.g. 178 cm',
                  keyboard: 'default' as const,
                },
                {
                  key: 'followings',
                  label: 'Following count',
                  placeholder: 'e.g. 150',
                  keyboard: 'numeric' as const,
                },
                {
                  key: 'completedCompetitions',
                  label: 'Completed competitions',
                  placeholder: 'e.g. 5',
                  keyboard: 'numeric' as const,
                },
                {
                  key: 'wonAwards',
                  label: 'Awards won',
                  placeholder: 'e.g. 3',
                  keyboard: 'numeric' as const,
                },
              ] as const
            ).map((field, index, arr) => (
              <View
                key={field.key}
                style={[styles.fieldBlock, index < arr.length - 1 && styles.fieldDivider]}
              >
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{field.label}</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.textPrimary }]}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={profileData[field.key]}
                  onChangeText={(text) => setProfileData({ ...profileData, [field.key]: text })}
                  keyboardType={field.keyboard}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save profile card</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <MediaUploadModal
          visible={showMediaUpload}
          onClose={() => setShowMediaUpload(false)}
          onMediaSelected={handleProfilePictureUpload}
          goalTitle="Profile Picture"
        />
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: { padding: 8, width: 40 },
  headerSpacer: { width: 40 },
  previewCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 22,
    alignItems: 'center',
  },
  avatarWrap: { marginBottom: 14 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  previewName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  previewMeta: { fontSize: 14, marginBottom: 18 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    paddingVertical: 14,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: CARD_BORDER },
  statValue: { fontSize: 18, fontWeight: '700', color: DARK },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    marginHorizontal: 24,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  fieldBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldDivider: { borderBottomWidth: 1, borderBottomColor: CARD_BORDER },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  textInput: { fontSize: 16, fontWeight: '500', padding: 0 },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
