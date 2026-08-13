import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CreateChallengeData, Challenge, CHALLENGE_CATEGORIES, CHALLENGE_ENTRY_FEES } from '../types/challenges';
import { useAuthStore } from '../state/authStore';
import {
  moderationAlertMessage,
  uploadMediaSafely,
} from '../lib/safeMediaUpload';
import { buildChallengeDateRange, formatChallengeShortDate } from '../lib/challengeDates';
import ChallengeCard from './ChallengeCard';

const DARK = '#1f2937';
const MUTED = '#6B7280';
const PAGE_BG = '#FCFAF9';
const CARD_BORDER = '#EEF0F3';
const FREE_USER_MAX_DAYS = 7;

const CATEGORY_OPTIONS = Object.values(CHALLENGE_CATEGORIES);

function categoryToSlug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Match ChallengeCard size so the crop UI frames the same area. */
const COVER_CROP_ASPECT: [number, number] = (() => {
  const screenW = Dimensions.get('window').width;
  const cardW = Math.max(160, Math.round((screenW - 48 - 12) / 2));
  return [cardW, 232];
})();

/** Earliest allowed challenge start: tomorrow (not today). */
function getEarliestStartDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Capitalize the first non-whitespace character (multiline-safe). */
function withLeadingCapital(value: string): string {
  if (!value) return value;
  const i = value.search(/\S/);
  if (i === -1) return value;
  const ch = value.charAt(i);
  const upper = ch.toUpperCase();
  if (ch === upper) return value;
  return value.slice(0, i) + upper + value.slice(i + 1);
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeData, type: 'private' | 'public') => Promise<void>;
  editMode?: boolean;
  initialData?: Partial<CreateChallengeData>;
  isPro?: boolean;
}

export default function CreateChallengeModal({
  visible,
  onClose,
  onSubmit,
  editMode = false,
  initialData,
  isPro = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [challengeType, setChallengeType] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  const [segmentTrackWidth, setSegmentTrackWidth] = useState(0);
  const segmentIndicatorX = useRef(new Animated.Value(0)).current;
  const segmentHasPositioned = useRef(false);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(
    categoryToSlug(initialData?.category || CHALLENGE_CATEGORIES.FITNESS)
  );
  const [durationDays, setDurationDays] = useState<number>(7);
  const [entryFee, setEntryFee] = useState<number>(CHALLENGE_ENTRY_FEES.STANDARD);
  const [requirementText, setRequirementText] = useState('');
  const [checkInsRequired, setCheckInsRequired] = useState<'everyday' | number>('everyday');
  const [startDate, setStartDate] = useState<Date>(getEarliestStartDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(initialData?.image_url || null);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialData?.title || '');
    setDescription(initialData?.description || '');
    setStep(1);
    segmentHasPositioned.current = false;
  }, [visible, initialData?.title, initialData?.description]);

  const segmentTabWidth = segmentTrackWidth > 0 ? segmentTrackWidth / 2 : 0;
  const segmentIndex = step === 1 ? 0 : 1;

  useEffect(() => {
    if (segmentTabWidth <= 0) return;
    const toValue = segmentIndex * segmentTabWidth;
    if (!segmentHasPositioned.current) {
      segmentHasPositioned.current = true;
      segmentIndicatorX.setValue(toValue);
      return;
    }
    Animated.spring(segmentIndicatorX, {
      toValue,
      useNativeDriver: true,
      stiffness: 230,
      damping: 24,
      mass: 0.9,
    }).start();
  }, [segmentIndex, segmentTabWidth, segmentIndicatorX]);

  const handleReset = () => {
    setStep(1);
    setChallengeType('private');
    setTitle('');
    setDescription('');
    setCategory(categoryToSlug(CHALLENGE_CATEGORIES.FITNESS));
    setDurationDays(7);
    setEntryFee(CHALLENGE_ENTRY_FEES.STANDARD);
    setRequirementText('');
    setCheckInsRequired('everyday');
    setStartDate(getEarliestStartDate());
    setShowDatePicker(false);
    setCoverImageUri(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDateChange = (_event: { type?: string }, selectedDate?: Date) => {
    if (!selectedDate) return;
    const earliest = getEarliestStartDate();
    const next = new Date(selectedDate);
    next.setHours(0, 0, 0, 0);
    setStartDate(next < earliest ? earliest : next);
  };

  const pickCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to add a cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: COVER_CROP_ASPECT,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCoverImageUri(result.assets[0].uri);
    }
  };

  const uploadCoverPhoto = async (localUri: string, userId: string): Promise<string> => {
    const ext = localUri.split('.').pop()?.toLowerCase()?.split('?')[0] ?? 'jpg';
    const safeExt = ['png', 'jpg', 'jpeg', 'heic', 'webp'].includes(ext) ? ext : 'jpg';
    const mime =
      safeExt === 'png'
        ? 'image/png'
        : safeExt === 'heic'
          ? 'image/heic'
          : safeExt === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2)}.${safeExt}`;
    const filePath = `${userId}/challenge-covers/${fileName}`;
    return uploadMediaSafely({
      uri: localUri,
      path: filePath,
      contentType: mime,
      fileName,
      mediaType: 'image',
    });
  };

  const validateStep2 = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a challenge title.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please enter a challenge description.');
      return false;
    }
    if (!requirementText.trim()) {
      Alert.alert('Missing requirement', 'Please enter at least one requirement.');
      return false;
    }
    const earliest = getEarliestStartDate();
    const selected = new Date(startDate);
    selected.setHours(0, 0, 0, 0);
    if (selected < earliest) {
      Alert.alert('Invalid start date', 'Challenges can only start from tomorrow onwards.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const selectedStart = new Date(startDate);
      selectedStart.setHours(0, 0, 0, 0);
      // 5:00am start day → 4:59am after `durationDays` (1 day on 4th = 4th 5am → 5th 4:59am)
      const { start: periodStart, end: periodEnd } = buildChallengeDateRange(
        selectedStart,
        durationDays
      );

      let imageUrl: string | undefined;
      if (coverImageUri) {
        if (/^https?:\/\//i.test(coverImageUri)) {
          imageUrl = coverImageUri;
        } else {
          if (!user?.id) {
            throw new Error('You must be signed in to upload a cover photo.');
          }
          imageUrl = await uploadCoverPhoto(coverImageUri, user.id);
        }
      }

      const isEveryday = checkInsRequired === 'everyday';
      const challengeData: CreateChallengeData = {
        title,
        description,
        category,
        duration_weeks: Math.max(1, Math.ceil(durationDays / 7)),
        entry_fee: entryFee,
        verification_type: 'photo',
        start_date: periodStart.toISOString(),
        end_date: periodEnd.toISOString(),
        visibility: challengeType,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        requirements: [
          {
            requirement_text: requirementText,
            frequency: isEveryday ? 'daily' : 'weekly',
            target_count: isEveryday ? durationDays : Number(checkInsRequired),
          },
        ],
      };

      await onSubmit(challengeData, challengeType);
      handleClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', moderationAlertMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const renderTypeCard = (
    type: 'private' | 'public',
    icon: React.ComponentProps<typeof Ionicons>['name'],
    titleText: string,
    body: string
  ) => {
    const selected = challengeType === type;
    return (
      <TouchableOpacity
        style={[styles.typeCard, selected && styles.typeCardSelected]}
        onPress={() => setChallengeType(type)}
        activeOpacity={0.85}
      >
        <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
          <Ionicons name={icon} size={20} color={selected ? '#FFFFFF' : DARK} />
        </View>
        <View style={styles.typeCopy}>
          <Text style={styles.typeTitle}>{titleText}</Text>
          <Text style={styles.typeBody}>{body}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  const minStartDate = getEarliestStartDate();

  const previewRange = buildChallengeDateRange(startDate, durationDays);
  const previewChallenge: Challenge = {
    id: 'preview',
    title: title.trim() || 'Your challenge title',
    description: description.trim() || '',
    category,
    duration_weeks: Math.max(1, Math.ceil(durationDays / 7)),
    entry_fee: entryFee,
    verification_type: 'photo',
    start_date: previewRange.start.toISOString(),
    end_date: previewRange.end.toISOString(),
    created_by: user?.id || 'preview',
    created_at: new Date().toISOString(),
    status: 'upcoming',
    visibility: challengeType,
    is_user_created: true,
    participant_count: 1,
    ...(coverImageUri ? { image_url: coverImageUri } : {}),
  };

  const formatScheduleMoment = (date: Date) =>
    date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.screen, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editMode ? 'Edit challenge' : 'Create challenge'}
            </Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.segmentBar}>
            <View
              style={styles.segmentTrack}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - segmentTrackWidth) > 0.5) {
                  setSegmentTrackWidth(w);
                }
              }}
            >
              {segmentTabWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentIndicator,
                    {
                      width: segmentTabWidth,
                      transform: [{ translateX: segmentIndicatorX }],
                    },
                  ]}
                />
              ) : null}
              <TouchableOpacity style={styles.segment} onPress={() => setStep(1)} activeOpacity={0.85}>
                <Text style={[styles.segmentText, step === 1 && styles.segmentTextActive]}>Type</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.segment} onPress={() => setStep(2)} activeOpacity={0.85}>
                <Text style={[styles.segmentText, step === 2 && styles.segmentTextActive]}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {step === 1 ? (
              <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
              >
                {renderTypeCard(
                  'private',
                  'lock-closed-outline',
                  'Private challenge',
                  'Share a join code with friends and compete together.'
                )}
                {renderTypeCard(
                  'public',
                  'globe-outline',
                  'Public challenge request',
                  'Suggest a challenge for the broader community after review.'
                )}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setStep(2)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!showDatePicker}
              >
                <Text style={styles.sectionLabel}>Basics</Text>
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Morning walk club"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={(text) => setTitle(withLeadingCapital(text))}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    textContentType="none"
                  />
                  <View style={styles.fieldDivider} />
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What do people need to do, and why?"
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={(text) => setDescription(withLeadingCapital(text))}
                    multiline
                    numberOfLines={4}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    textContentType="none"
                  />
                  <View style={styles.fieldDivider} />
                  <Text style={styles.fieldLabel}>Requirement</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Walk 10,000 steps"
                    placeholderTextColor="#9CA3AF"
                    value={requirementText}
                    onChangeText={(text) => setRequirementText(withLeadingCapital(text))}
                    autoCorrect
                    spellCheck
                    autoCapitalize="sentences"
                    textContentType="none"
                  />
                  <View style={styles.fieldDivider} />
                  <Text style={styles.fieldLabel}>Tag</Text>
                  <Text style={styles.hint}>Pick the category that best fits this challenge.</Text>
                  <View style={styles.tagRow}>
                    {CATEGORY_OPTIONS.map((label) => {
                      const slug = categoryToSlug(label);
                      const selected = category === slug;
                      return (
                        <TouchableOpacity
                          key={slug}
                          style={[styles.tagChip, selected && styles.chipSelected]}
                          onPress={() => setCategory(slug)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Card preview</Text>
                <View style={styles.formCard}>
                  <Text style={styles.hint}>
                    {challengeType === 'private'
                      ? 'This is how your challenge will appear on Compete. Add a photo, then crop to frame the part you want on the card.'
                      : 'This is how your challenge would appear on Compete. Add a cover photo so our team can review the full card look.'}
                  </Text>
                  <View style={styles.cardPreviewRow}>
                    <ChallengeCard challenge={previewChallenge} onPress={() => {}} />
                  </View>
                  <View style={styles.coverActions}>
                    <TouchableOpacity
                      style={styles.coverActionBtn}
                      onPress={pickCoverPhoto}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="images-outline" size={16} color={DARK} />
                      <Text style={styles.coverActionText}>
                        {coverImageUri ? 'Change photo' : 'Add cover photo'}
                      </Text>
                    </TouchableOpacity>
                    {coverImageUri ? (
                      <TouchableOpacity
                        style={styles.coverActionBtn}
                        onPress={() => setCoverImageUri(null)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                        <Text style={[styles.coverActionText, { color: '#B91C1C' }]}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Schedule</Text>
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Start date</Text>
                  <TouchableOpacity
                    style={styles.dateRow}
                    onPress={() => setShowDatePicker((open) => !open)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={18} color={DARK} />
                    <Text style={styles.dateText}>
                      {startDate.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Ionicons
                      name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                      color={MUTED}
                    />
                  </TouchableOpacity>

                  {showDatePicker ? (
                    <View style={styles.datePickerBox}>
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="spinner"
                        themeVariant="light"
                        minimumDate={minStartDate}
                        onChange={handleDateChange}
                        style={styles.datePickerControl}
                      />
                      <TouchableOpacity
                        style={styles.doneChip}
                        onPress={() => setShowDatePicker(false)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.doneChipText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.fieldDivider} />
                  <Text style={styles.fieldLabel}>Duration</Text>
                  {!isPro && (
                    <Text style={styles.hint}>Free accounts can create up to 7-day challenges.</Text>
                  )}
                  <View style={styles.feeChipRow}>
                    {[1, 3, 7, 14, 30].map((days) => {
                      const locked = !isPro && days > FREE_USER_MAX_DAYS;
                      const selected = durationDays === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          style={[
                            styles.feeChip,
                            selected && styles.chipSelected,
                            locked && styles.chipLocked,
                          ]}
                          onPress={() => {
                            if (locked) {
                              Alert.alert(
                                'Pro feature',
                                'Challenges longer than 7 days are available on Pro.'
                              );
                              return;
                            }
                            setDurationDays(days);
                            setCheckInsRequired((prev) => {
                              if (prev === 'everyday') return 'everyday';
                              if (typeof prev === 'number' && prev > days) return 'everyday';
                              return prev;
                            });
                          }}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected && styles.chipTextSelected,
                              locked && styles.chipTextLocked,
                            ]}
                          >
                            {days === 1 ? '1d' : `${days}d`}
                          </Text>
                          {locked ? <Text style={styles.proTag}>PRO</Text> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.scheduleSummary}>
                    <View style={styles.scheduleSummaryRow}>
                      <Text style={styles.scheduleSummaryLabel}>Starts</Text>
                      <Text style={styles.scheduleSummaryValue}>
                        {formatScheduleMoment(previewRange.start)}
                      </Text>
                    </View>
                    <View style={styles.scheduleSummaryRow}>
                      <Text style={styles.scheduleSummaryLabel}>Ends</Text>
                      <Text style={styles.scheduleSummaryValue}>
                        {formatScheduleMoment(previewRange.end)}
                      </Text>
                    </View>
                    <Text style={styles.scheduleSummaryHint}>
                      {durationDays === 1
                        ? `1 day · ${formatChallengeShortDate(previewRange.start.toISOString())} 5:00am → ${formatChallengeShortDate(previewRange.end.toISOString())} 4:59am`
                        : `${durationDays} days · each day runs 5:00am–4:59am next morning`}
                    </Text>
                  </View>

                  <View style={styles.fieldDivider} />
                  <Text style={styles.fieldLabel}>Check-ins required</Text>
                  <Text style={styles.hint}>
                    {durationDays <= 7
                      ? 'How many times participants must submit during this challenge.'
                      : 'How many times participants must submit each week.'}
                  </Text>
                  <View style={styles.checkInRow}>
                    <TouchableOpacity
                      style={[
                        styles.checkInChip,
                        styles.checkInEveryday,
                        checkInsRequired === 'everyday' && styles.chipSelected,
                      ]}
                      onPress={() => setCheckInsRequired('everyday')}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          checkInsRequired === 'everyday' && styles.chipTextSelected,
                        ]}
                      >
                        Every day
                      </Text>
                    </TouchableOpacity>
                    {Array.from(
                      { length: Math.max(0, Math.min(7, durationDays) - 1) },
                      (_, i) => i + 2
                    ).map((count) => {
                      const selected = checkInsRequired === count;
                      return (
                        <TouchableOpacity
                          key={count}
                          style={[styles.checkInChip, selected && styles.chipSelected]}
                          onPress={() => setCheckInsRequired(count)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {count}×
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.checkInSummary}>
                    {checkInsRequired === 'everyday'
                      ? `One submission every day (${durationDays} total).`
                      : durationDays <= 7
                        ? `${checkInsRequired} submissions anytime during the challenge.`
                        : `${checkInsRequired} submissions required each week.`}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>Stake</Text>
                <View style={styles.formCard}>
                  <Text style={styles.fieldLabel}>Entry fee</Text>
                  <View style={styles.feeChipRow}>
                    {[
                      CHALLENGE_ENTRY_FEES.STANDARD,
                      CHALLENGE_ENTRY_FEES.PRO,
                      30,
                      40,
                      50,
                    ].map((fee) => {
                      const selected = entryFee === fee;
                      return (
                        <TouchableOpacity
                          key={fee}
                          style={[styles.feeChip, selected && styles.chipSelected]}
                          onPress={() => setEntryFee(fee)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            £{fee}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {entryFee > 0 && (
                    <View style={styles.noteBox}>
                      <Ionicons name="information-circle-outline" size={18} color={DARK} />
                      <Text style={styles.noteText}>
                        Platform takes 30% commission only if a Free member joins. If every participant is Pro, no commission is taken.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setStep(1)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.primaryButtonFlex, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {challengeType === 'private' ? 'Create challenge' : 'Send request'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  segmentBar: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  segmentTrack: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'stretch',
    width: '100%',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    backgroundColor: DARK,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  segmentText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 18,
    marginBottom: 16,
  },
  heroEyebrow: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: DARK,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginBottom: 10,
  },
  typeCardSelected: {
    borderColor: DARK,
    backgroundColor: '#FFFFFF',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: {
    backgroundColor: DARK,
  },
  typeCopy: { flex: 1, minWidth: 0 },
  typeTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  typeBody: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 8,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginVertical: 14,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: DARK,
    padding: 0,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  datePickerBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: '#F8F9FB',
    overflow: 'hidden',
    paddingBottom: 8,
  },
  datePickerControl: {
    alignSelf: 'stretch',
    height: 180,
  },
  doneChip: {
    alignSelf: 'flex-end',
    marginRight: 10,
    backgroundColor: DARK,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 10,
    lineHeight: 16,
  },
  feeChipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  feeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  checkInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkInChip: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  checkInEveryday: {
    paddingHorizontal: 14,
  },
  checkInSummary: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: DARK,
    lineHeight: 16,
  },
  chipSelected: {
    backgroundColor: DARK,
  },
  chipLocked: {
    opacity: 0.55,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextLocked: {
    color: MUTED,
  },
  proTag: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  coverActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  coverActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coverActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  cardPreviewRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  scheduleSummary: {
    marginTop: 14,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  scheduleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleSummaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    width: 52,
  },
  scheduleSummaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    textAlign: 'right',
  },
  scheduleSummaryHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: MUTED,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 0.9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonFlex: {
    flex: 1.4,
    marginTop: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
