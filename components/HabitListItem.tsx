import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

interface HabitListItemProps {
  card: any;
  cardState: any;
  isCompleted: boolean;
  /** If set, controls checkmark only (defaults to isCompleted). Core quick-complete still shows check; use alert icon via showPendingIndicator. */
  showCompletionCheckmark?: boolean;
  /** Called when user chooses "Uncomplete" from the ... menu (core habits only). */
  onUncomplete?: () => void;
  partnership: any;
  pendingInvite: any;
  partnerStatus: any;
  onPress: () => void;
  onLongPress: () => void;
  onInvite: () => void;
  onNudge: () => Promise<Date | null>;
  onRemovePartner: () => void;
  onCancelInvite: () => void;
  lastNudgeTime: Date | null;
  showPendingIndicator: boolean;
  /** 0–1 fill level; component animates internally (mirrors WhiteHabitCard) */
  progress: number;
  progressFillColor: string;
  progressTrackColor: string;
  theme: any;
  styles: any;
  backgroundColor?: string;
  isDark?: boolean;
  onEdit?: () => void;
  onInfo?: () => void;
}

const HabitListItem: React.FC<HabitListItemProps> = ({
  card,
  cardState,
  isCompleted,
  showCompletionCheckmark,
  onUncomplete,
  partnership,
  pendingInvite,
  partnerStatus,
  onPress,
  onLongPress,
  onInvite,
  onNudge,
  onRemovePartner,
  onCancelInvite,
  lastNudgeTime,
  showPendingIndicator,
  progress,
  progressFillColor,
  progressTrackColor,
  theme,
  styles,
  backgroundColor,
  isDark = false,
  onEdit,
  onInfo
}) => {
  const showCheck = showCompletionCheckmark !== undefined ? showCompletionCheckmark : isCompleted;
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canNudge, setCanNudge] = useState(true);

  // Mirror WhiteHabitCard: own Animated.Value, animate when `progress` prop changes
  const [progressAnimated] = useState(new Animated.Value(progress));
  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: progress,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimated]);
  const animatedWidth = progressAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    if (!lastNudgeTime) {
      setCanNudge(true);
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const nudgeTime = new Date(lastNudgeTime);
      const threeHoursLater = new Date(nudgeTime.getTime() + 3 * 60 * 60 * 1000);
      const diffMs = threeHoursLater.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCanNudge(true);
        setTimeRemaining('');
      } else {
        setCanNudge(false);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const remaining = `${hours}h ${minutes}m`;
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [lastNudgeTime]);

  const renderPartnershipControls = () => {
    if (partnership) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity 
            onPress={(e) => { 
              e.stopPropagation(); 
              Alert.alert('Partner', `Tracking with ${partnership.partner?.username || 'Friend'}`); 
            }}
          >
            <Image 
              source={{ uri: partnership.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
              style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
            />
          </TouchableOpacity>
          {partnerStatus?.completed ? (
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, fontWeight: '600' }}>
              Completed ✓
            </Text>
          ) : canNudge ? (
            <TouchableOpacity 
              onPress={async (e) => { 
                e.stopPropagation(); 
                await onNudge(); 
              }}
              style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                borderRadius: 8,
              }}
            >
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 10, fontWeight: '600' }}>
                Nudge
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 9 }}>
              {timeRemaining}
            </Text>
          )}
        </View>
      );
    } else if (pendingInvite) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity 
            onPress={(e) => { 
              e.stopPropagation(); 
              Alert.alert('Pending Invite', `Waiting for ${pendingInvite.partner?.username || 'Friend'} to accept`); 
            }}
          >
            <Image 
              source={{ uri: pendingInvite.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
              style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: theme.borderSecondary, opacity: 0.6 }}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={(e) => { 
              e.stopPropagation(); 
              onCancelInvite(); 
            }}
            style={{ 
              paddingHorizontal: 6, 
              paddingVertical: 3, 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
          <TouchableOpacity 
            onPress={(e) => { 
              e.stopPropagation(); 
              onInvite(); 
            }}
            style={{ 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 8,
            }}
          >
            <Ionicons name="person-add-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>
      );
    }
  };

  // Determine background color - use provided backgroundColor or default based on card type
  const cardBgColor = backgroundColor || (isDark ? '#1f1f1f' : '#111827');
  const isCustomHabit = backgroundColor === '#FFFFFF';
  
  // For custom habits (white background), use accent color header like carousel
  // For core habits (dark background), use dark background with white text
  const textColor = isCustomHabit ? '#FFFFFF' : '#ffffff';
  const metricColor = isCustomHabit ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)';
  const headerBgColor = isCustomHabit ? (card.accent || '#10B981') : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      delayLongPress={250}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.habitListItem, { backgroundColor: cardBgColor, borderColor: 'transparent' }]}
    >
      {/* Header with accent color for custom habits */}
      {isCustomHabit && (
        <View style={[{
          backgroundColor: headerBgColor,
          borderRadius: 12,
          marginTop: -12,
          marginLeft: -16,
          marginRight: -16,
          paddingTop: 12,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 8,
          marginBottom: 8,
        }]}>
          <View style={styles.habitListItemTopRow}>
            {/* Left Section */}
            <View style={[styles.habitListItemLeft, { flex: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text 
                  style={[styles.habitListItemTitle, { color: textColor, flex: 1 }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {card.title}
                </Text>
                <Text style={[styles.habitListItemMetric, { color: metricColor, marginRight: 4 }]}>
                  {card.metricLabel}: {card.metricValue}
                </Text>
                {showCheck && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#10B981"
                    style={{ flexShrink: 0 }}
                  />
                )}
                {showPendingIndicator && (
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color="#F87171"
                    style={{ flexShrink: 0 }}
                  />
                )}
              </View>
            </View>
            
            {/* Right Section - Partnership Controls and Menu */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {renderPartnershipControls()}
              {(onEdit || partnership) && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!card.habit || !onEdit) return;
                    const options: any[] = [];
                    if (onInfo) {
                      options.push({ text: 'Info', onPress: () => onInfo() });
                    }
                    options.push({ text: 'Edit Habit', onPress: () => onEdit() });
                    if (partnership) {
                      options.push({
                        text: 'Remove Partner',
                        style: 'destructive',
                        onPress: () => onRemovePartner(),
                      });
                    } else {
                      options.push({ text: 'Invite a Friend', onPress: () => onInvite() });
                    }
                    options.push({ text: 'Cancel', style: 'cancel' });
                    Alert.alert(card.title, 'Choose an option', options);
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons 
                    name="ellipsis-vertical" 
                    size={16} 
                    color="rgba(255, 255, 255, 0.9)" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
      
      {/* For core habits (dark background), show content directly */}
      {!isCustomHabit && (
        <View style={styles.habitListItemTopRow}>
          {/* Left Section */}
          <View style={[styles.habitListItemLeft, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Text 
                style={[styles.habitListItemTitle, { color: textColor, flex: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {card.title}
              </Text>
              <Text style={[styles.habitListItemMetric, { color: metricColor, marginRight: 4 }]}>
                {card.metricLabel}: {card.metricValue}
              </Text>
              {showCheck && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#10B981"
                  style={{ flexShrink: 0 }}
                />
              )}
              {showPendingIndicator && (
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color="#F87171"
                  style={{ flexShrink: 0 }}
                />
              )}
            </View>
          </View>
          
          {/* Right Section - Partnership Controls and Menu */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {renderPartnershipControls()}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                const options: any[] = [
                  { text: 'Edit / Enter details', onPress: () => onInfo?.() ?? onPress() },
                ];
                if (partnership) {
                  options.push({ text: 'Remove Partner', style: 'destructive', onPress: () => onRemovePartner() });
                } else {
                  options.push({ text: 'Invite a Friend', onPress: () => onInvite() });
                }
                if (isCompleted && onUncomplete) {
                  options.push({ text: 'Uncomplete', style: 'destructive', onPress: () => onUncomplete() });
                }
                options.push({ text: 'Cancel', style: 'cancel' });
                Alert.alert(card.title, 'Choose an option', options);
              }}
              style={{ padding: 4 }}
            >
              <Ionicons 
                name="ellipsis-vertical" 
                size={16} 
                color="rgba(255, 255, 255, 0.65)" 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      <View style={[styles.habitListItemProgress, { backgroundColor: progressTrackColor, marginTop: 8 }]}>
        <Animated.View
          style={[
            {
              height: '100%',
              width: animatedWidth,
              backgroundColor: progressFillColor,
              borderRadius: 999,
            },
            isCompleted && {
              shadowColor: progressFillColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 10,
              elevation: 10,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

export default HabitListItem;
