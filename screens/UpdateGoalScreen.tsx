import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CustomBackground from '../components/CustomBackground';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import { useGoalsStore } from '../state/goalsStore';
import { supabase } from '../lib/supabase';
import { progressService } from '../lib/progressService';
import { postsService } from '../lib/postsService';
import { getDailyPostDate } from '../lib/timeService';
import { moderationAlertMessage, uploadMediaSafely } from '../lib/safeMediaUpload';
import { calculateCompletionPercentage } from '../lib/goalHelpers';
import { Goal, GoalProgress } from '../types/database';

export type UpdateGoalParams = {
  UpdateGoal: {
    goalId?: string;
    /** When true, hide goal picker and keep updates on this goal only */
    lockGoal?: boolean;
    /** ISO date string for backdated check-ins */
    targetCheckInDate?: string;
  };
};

const DARK = '#1f2937';
const MUTED = '#6B7280';
const PAGE_BG = '#F8F9FB';
const PROGRESS_BUMPS = [1, 3, 5, 10, 20] as const;
type ProgressBump = (typeof PROGRESS_BUMPS)[number];

export default function UpdateGoalScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UpdateGoalParams, 'UpdateGoal'>>();
  const { user } = useAuthStore();
  const { trackCoreHabit } = useActionStore();
  const fetchGoals = useGoalsStore((s) => s.fetchGoals);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const lockedGoalId = route.params?.lockGoal ? route.params?.goalId : undefined;
  const goalLocked = !!lockedGoalId;
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    route.params?.goalId || ''
  );
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const [progressBump, setProgressBump] = useState<ProgressBump>(1);
  const [estimatedPctByGoal, setEstimatedPctByGoal] = useState<Record<string, number>>({});
  const targetCheckInDate = route.params?.targetCheckInDate
    ? new Date(route.params.targetCheckInDate)
    : null;

  useEffect(() => {
    loadGoals();
  }, [user?.id]);

  useEffect(() => {
    if (route.params?.goalId) {
      setSelectedGoalId(route.params.goalId);
    }
  }, [route.params?.goalId]);

  const selectGoal = (goalId: string) => {
    if (goalLocked) return;
    setSelectedGoalId(goalId);
    setSelectedMilestoneIndex(null);
    setProgressBump(1);
  };

  const loadGoals = async () => {
    if (!user?.id) {
      setLoadingGoals(false);
      return;
    }

    setLoadingGoals(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const loaded = data || [];
      setGoals(loaded);

      if (!selectedGoalId && loaded.length === 1) {
        setSelectedGoalId(loaded[0].id);
      }

      // Estimate % from check-ins for goals that haven't set manual progress yet
      const estimates: Record<string, number> = {};
      await Promise.all(
        loaded.map(async (goal) => {
          if (typeof goal.progress_percent === 'number') return;
          if (!goal.start_date || !user?.id) {
            estimates[goal.id] = 0;
            return;
          }
          const count = await progressService.getCheckInCountInRange(
            goal.id,
            user.id,
            goal.start_date,
            goal.end_date,
            goal.frequency
          );
          const mockEntries = Array.from({ length: count }, (_, i) => ({
            id: `est-${i}`,
            goal_id: goal.id,
            user_id: user.id,
            completed_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })) as GoalProgress[];
          estimates[goal.id] = calculateCompletionPercentage(goal, mockEntries);
        })
      );
      setEstimatedPctByGoal(estimates);
    } catch (error) {
      console.error('Error loading goals:', error);
      Alert.alert('Error', 'Failed to load your goals.');
    } finally {
      setLoadingGoals(false);
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const filePath = `${user.id}/posts/${uniqueFileName}`;

    return uploadMediaSafely({
      uri,
      path: filePath,
      contentType: 'image/jpeg',
      fileName: uniqueFileName,
      mediaType: 'image',
    });
  };

  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Photo limit', 'You can add up to 5 photos per update.');
      return;
    }

    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            await addUploadedPhoto(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Photo library access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) {
            await addUploadedPhoto(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const addUploadedPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const url = await uploadPhoto(uri);
      if (!url) {
        Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
        return;
      }
      setPhotos((prev) => [url, ...prev]);
    } catch (error) {
      console.error('Error uploading goal photo:', error);
      Alert.alert('Upload blocked', moderationAlertMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const goalMilestones = (selectedGoal?.milestones || [])
    .map((m, index) => ({
      index,
      title: typeof m === 'string' ? m.trim() : String(m),
    }))
    .filter((m) => m.title.length > 0);
  const selectedMilestoneTitle =
    selectedMilestoneIndex != null
      ? goalMilestones.find((m) => m.index === selectedMilestoneIndex)?.title || null
      : null;

  const currentProgressPct = selectedGoal
    ? typeof selectedGoal.progress_percent === 'number'
      ? Math.max(0, Math.min(100, Math.round(selectedGoal.progress_percent)))
      : estimatedPctByGoal[selectedGoal.id] ?? 0
    : 0;
  const nextProgressPct = Math.min(100, currentProgressPct + progressBump);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to update a goal.');
      return;
    }
    if (!selectedGoalId || !selectedGoal) {
      Alert.alert('Choose a goal', 'Select which goal you want to update.');
      return;
    }
    if (selectedGoal.user_id && selectedGoal.user_id !== user.id) {
      Alert.alert('Not allowed', 'You can only update your own goals.');
      return;
    }
    if (currentProgressPct >= 100) {
      Alert.alert('Already complete', 'This goal is already at 100%.');
      return;
    }

    setSubmitting(true);
    try {
      const checkInDate = targetCheckInDate || new Date();
      const noteWithMilestone = [
        note.trim(),
        selectedMilestoneTitle ? `Milestone: ${selectedMilestoneTitle}` : '',
        `Progress +${progressBump}% → ${nextProgressPct}%`,
      ]
        .filter(Boolean)
        .join('\n');

      // Always bump manual progress on update (default +1%)
      const { error: progressError } = await supabase
        .from('goals')
        .update({
          progress_percent: nextProgressPct,
          last_updated_at: new Date().toISOString(),
          ...(nextProgressPct >= 100 ? { completed: true } : {}),
        })
        .eq('id', selectedGoalId)
        .eq('user_id', user.id);

      if (progressError) {
        throw new Error(progressError.message || 'Failed to update progress');
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoalId
            ? {
                ...g,
                progress_percent: nextProgressPct,
                completed: nextProgressPct >= 100 ? true : g.completed,
              }
            : g
        )
      );
      // Keep profile / goals list in sync
      await fetchGoals(user.id);

      // Always record a check-in so Reminders ("due today" / overdue) clear
      if (photos.length > 0) {
        for (const photoUrl of photos) {
          const result = await progressService.createCheckIn({
            goalId: selectedGoalId,
            userId: user.id,
            photoUri: photoUrl,
            note: noteWithMilestone || undefined,
            checkInDate,
          });
          if (!result.success) {
            throw new Error('Failed to save goal update');
          }
        }
      } else {
        const result = await progressService.createCheckIn({
          goalId: selectedGoalId,
          userId: user.id,
          note: noteWithMilestone || undefined,
          checkInDate,
        });
        if (!result.success) {
          throw new Error('Failed to save goal update');
        }
      }

      // Private by default: only write to Posts / feed when explicitly enabled
      if (shareToFeed === true) {
        const feedResult = await postsService.createPost({
          content:
            note.trim() ||
            `+${progressBump}% on ${selectedGoal.title} (${nextProgressPct}%)`,
          date: getDailyPostDate(checkInDate),
          photos,
          habits_completed: [],
          caption: note.trim() || undefined,
          goal_id: selectedGoalId,
          goal_title: selectedGoal.title,
          milestone_title: selectedMilestoneTitle || undefined,
          is_public: true,
        });

        if (!feedResult) {
          Alert.alert(
            'Goal updated',
            'Progress was saved, but posting to the feed failed. Try again later.'
          );
          navigation.goBack();
          return;
        }
      }

      trackCoreHabit('update_goal');
      Alert.alert(
        'Updated',
        `Progress is now ${nextProgressPct}% (+${progressBump}%).${
          shareToFeed ? ' Posted to feed.' : ''
        }`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error updating goal:', error);
      Alert.alert('Upload blocked', moderationAlertMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Update Goal</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {targetCheckInDate ? (
              <Text style={styles.dateHint}>
                Dating this update for{' '}
                {targetCheckInDate.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            ) : null}

            <Text style={styles.sectionLabel}>Your goal</Text>
            {loadingGoals ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={DARK} />
              </View>
            ) : goals.length === 0 ? (
              <View style={styles.emptyGoals}>
                <Text style={styles.emptyGoalsText}>You don’t have any active goals yet.</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Go back</Text>
                </TouchableOpacity>
              </View>
            ) : goalLocked && selectedGoal ? (
              <View style={[styles.goalRow, styles.goalRowSelected, styles.goalRowLocked]}>
                <View style={styles.goalCopy}>
                  <Text style={styles.goalTitle} numberOfLines={2}>
                    {selectedGoal.title}
                  </Text>
                  <Text style={styles.goalMeta}>
                    {typeof selectedGoal.progress_percent === 'number'
                      ? `${Math.round(selectedGoal.progress_percent)}% complete`
                      : `${estimatedPctByGoal[selectedGoal.id] ?? 0}% complete`}
                    {selectedGoal.category ? ` · ${selectedGoal.category}` : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.goalList}>
                {goals.map((goal) => {
                  const selected = goal.id === selectedGoalId;
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={[styles.goalRow, selected && styles.goalRowSelected]}
                      onPress={() => selectGoal(goal.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.goalCopy}>
                        <Text style={styles.goalTitle} numberOfLines={2}>
                          {goal.title}
                        </Text>
                        <Text style={styles.goalMeta}>
                          {typeof goal.progress_percent === 'number'
                            ? `${Math.round(goal.progress_percent)}% complete`
                            : `${estimatedPctByGoal[goal.id] ?? 0}% complete`}
                          {goal.category ? ` · ${goal.category}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.sectionLabel}>Progress bump</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressSummary}>
                <Text style={styles.progressSummaryLabel}>Current</Text>
                <Text style={styles.progressSummaryValue}>{currentProgressPct}%</Text>
                <Ionicons name="arrow-forward" size={16} color={MUTED} />
                <Text style={styles.progressSummaryLabel}>After update</Text>
                <Text style={[styles.progressSummaryValue, styles.progressSummaryNext]}>
                  {nextProgressPct}%
                </Text>
              </View>
              <View style={styles.bumpRow}>
                {PROGRESS_BUMPS.map((bump) => {
                  const selected = progressBump === bump;
                  const disabled = currentProgressPct >= 100;
                  return (
                    <TouchableOpacity
                      key={bump}
                      style={[
                        styles.bumpChip,
                        selected && styles.bumpChipSelected,
                        disabled && styles.bumpChipDisabled,
                      ]}
                      onPress={() => setProgressBump(bump)}
                      activeOpacity={0.85}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.bumpChipText,
                          selected && styles.bumpChipTextSelected,
                        ]}
                      >
                        +{bump}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionLabel}>Update</Text>
            <View style={styles.noteCard}>
              <TextInput
                style={styles.noteInput}
                placeholder={
                  selectedGoal
                    ? `What progress did you make on “${selectedGoal.title}”?`
                    : 'Write a short update…'
                }
                placeholderTextColor="#9CA3AF"
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{note.length}/500</Text>
            </View>

            <Text style={styles.sectionLabel}>Photos</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.85}
                disabled={uploading || submitting}
              >
                {uploading ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={22} color={DARK} />
                    <Text style={styles.addPhotoText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>

              {photos.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removePhoto(index)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {goalMilestones.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Milestone</Text>
                <View style={styles.milestoneList}>
                  <TouchableOpacity
                    style={[
                      styles.milestoneRow,
                      selectedMilestoneIndex == null && styles.milestoneRowSelected,
                    ]}
                    onPress={() => setSelectedMilestoneIndex(null)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.milestoneText,
                        selectedMilestoneIndex == null && styles.milestoneTextSelected,
                      ]}
                    >
                      No milestone
                    </Text>
                  </TouchableOpacity>
                  {goalMilestones.map((milestone) => {
                    const selected = selectedMilestoneIndex === milestone.index;
                    return (
                      <TouchableOpacity
                        key={`${milestone.index}-${milestone.title}`}
                        style={[styles.milestoneRow, selected && styles.milestoneRowSelected]}
                        onPress={() => setSelectedMilestoneIndex(milestone.index)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.milestoneBadge, selected && styles.milestoneBadgeSelected]}>
                          <Text
                            style={[
                              styles.milestoneBadgeText,
                              selected && styles.milestoneBadgeTextSelected,
                            ]}
                          >
                            {milestone.index + 1}
                          </Text>
                        </View>
                        <Text
                          style={[styles.milestoneText, selected && styles.milestoneTextSelected]}
                          numberOfLines={2}
                        >
                          {milestone.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionLabel}>Sharing</Text>
            <TouchableOpacity
              style={styles.shareRow}
              onPress={() => setShareToFeed((prev) => !prev)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={shareToFeed ? 'checkbox' : 'square-outline'}
                size={24}
                color={shareToFeed ? '#10B981' : MUTED}
              />
              <View style={styles.shareCopy}>
                <Text style={styles.shareTitle}>Post to feed</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || uploading || !selectedGoalId) && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting || uploading || !selectedGoalId}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>
                  {selectedGoalId ? `Update · +${progressBump}%` : 'Post update'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CustomBackground>
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
  },
  backButton: {
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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dateHint: {
    marginBottom: 14,
    fontSize: 12,
    fontWeight: '600',
    color: DARK,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 22,
  },
  emptyGoals: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 22,
  },
  emptyGoalsText: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PAGE_BG,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  goalList: {
    gap: 8,
    marginBottom: 22,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  goalRowSelected: {
    borderColor: DARK,
    backgroundColor: '#F8FAFC',
  },
  goalRowLocked: {
    marginBottom: 22,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: DARK,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DARK,
  },
  goalCopy: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  goalMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  progressSummaryLabel: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '600',
  },
  progressSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
  },
  progressSummaryNext: {
    color: '#059669',
  },
  bumpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bumpChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bumpChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  bumpChipDisabled: {
    opacity: 0.45,
  },
  bumpChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  bumpChipTextSelected: {
    color: '#FFFFFF',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 22,
    minHeight: 140,
  },
  noteInput: {
    flex: 1,
    minHeight: 100,
    fontSize: 15,
    lineHeight: 22,
    color: DARK,
    fontWeight: '500',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  addPhotoButton: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK,
  },
  photoThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneList: {
    gap: 8,
    marginBottom: 22,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  milestoneRowSelected: {
    borderColor: DARK,
    backgroundColor: '#F8FAFC',
  },
  milestoneBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneBadgeSelected: {
    backgroundColor: DARK,
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK,
  },
  milestoneBadgeTextSelected: {
    color: '#FFFFFF',
  },
  milestoneText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  milestoneTextSelected: {
    color: DARK,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  shareCopy: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FCFAF9',
  },
  submitButton: {
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
