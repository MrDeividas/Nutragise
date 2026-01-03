import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface WhiteHabitCardProps {
  card: any;
  index: number;
  totalCards: number;
  spotlightCardWidth: number;
  whiteCardShadowColor: string;
  customHabitsLoading: boolean;
  theme: any;
  customHabitsDate: string;
  todayDate: string;
  toggleHabitCompletion: (habitId: string, date: string) => void;
  playCompletionSound: () => void;
  loadHabitForEditing: (habit: any) => void;
  setShowCustomHabitModal: (show: boolean) => void;
  partnership: any;
  pendingInvite: any;
  partnerStatus: any;
  onInvite: () => void;
  onRemovePartner: () => void;
  onCancelInvite: () => void;
  onNudge: () => Promise<Date | null>;
  lastNudgeTime: Date | null;
  styles: any;
}

const WhiteHabitCard = ({ 
  card, 
  index, 
  totalCards,
  spotlightCardWidth, 
  whiteCardShadowColor, 
  customHabitsLoading, 
  theme,
  customHabitsDate,
  todayDate,
  toggleHabitCompletion,
  playCompletionSound,
  loadHabitForEditing,
  setShowCustomHabitModal,
  partnership,
  pendingInvite,
  partnerStatus,
  onInvite,
  onRemovePartner,
  onCancelInvite,
  onNudge,
  lastNudgeTime,
  styles
}: WhiteHabitCardProps) => {
  const isCreateCard = card.key === 'create_new_habit';
  const [progressAnimated] = useState(new Animated.Value(card.progress ?? 0));
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canNudge, setCanNudge] = useState(true);
  
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
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastNudgeTime]);
  
  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: card.progress ?? 0,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [card.progress, progressAnimated]);

  const animatedWidth = progressAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleCardPress = useCallback(() => {
    if (isCreateCard) {
      setShowCustomHabitModal(true);
    } else {
      // Show info/edit modal instead of expanding
      loadHabitForEditing(card.habit);
    }
  }, [isCreateCard, setShowCustomHabitModal, loadHabitForEditing, card.habit]);

  const handleCardLongPress = useCallback(() => {
    if (isCreateCard || !card.habit) return;
    playCompletionSound();
    toggleHabitCompletion(card.habit.id, customHabitsDate || todayDate);
  }, [isCreateCard, card.habit, playCompletionSound, toggleHabitCompletion, customHabitsDate, todayDate]);

  const isCompleted = !isCreateCard && (card.progress >= 1);
  const cardBackgroundColor = isCompleted ? '#10B981' : '#FFFFFF';
  const titleColor = isCompleted ? '#FFFFFF' : theme.textPrimary;
  const subtitleColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary;
  const iconColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary;
  const progressTrackColor = isCompleted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  const progressFillColor = card.accent;

  return (
    <Animated.View
      style={[
        styles.whiteHabitCard,
        {
          width: spotlightCardWidth,
          marginRight: index === totalCards - 1 ? 0 : 10,
          marginVertical: 8,
          shadowColor: whiteCardShadowColor,
          backgroundColor: isCreateCard ? '#9CA3AF' : (isCompleted ? '#10B981' : '#FFFFFF'),
          borderColor: isCompleted ? 'transparent' : '#E5E7EB',
          paddingBottom: 16, // Ensure enough space at bottom
          overflow: 'visible' // Allow content to show if slightly outside
        },
        !isCreateCard && customHabitsLoading && styles.whiteHabitCardDisabled,
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.85}
        onPress={handleCardPress}
        onLongPress={handleCardLongPress}
        delayLongPress={250}
        disabled={!isCreateCard && customHabitsLoading}
        style={{ flex: 1, paddingBottom: 10 }}
      >
      <View style={[styles.whiteHabitCardHeader, { 
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginTop: -16,
        marginLeft: -16,
        marginRight: -16,
        paddingTop: 16,
        paddingLeft: 16,
        paddingRight: 16,
        marginBottom: 16,
        alignItems: 'flex-start'
      }]}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={[styles.whiteHabitCardTitle, { color: isCreateCard ? '#FFFFFF' : '#FFFFFF' }]}>
            {card.title}
          </Text>
          <Text style={[styles.whiteHabitCardSubtitle, { color: 'rgba(255, 255, 255, 0.85)' }]}>{card.subtitle}</Text>
          </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!isCreateCard && card.habit && (
      <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              if (partnership) {
                // Show options for Edit and Remove Partner
                Alert.alert(
                  card.title,
                  'Choose an option',
                  [
                    {
                      text: 'Edit Habit',
                      onPress: () => loadHabitForEditing(card.habit)
                    },
                    {
                      text: 'Remove Partner',
                      style: 'destructive',
                      onPress: () => onRemovePartner()
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    }
                  ]
                );
              } else {
                // No partnership, just edit
                if (card.habit) {
                  loadHabitForEditing(card.habit);
                }
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
      </TouchableOpacity>
        )}
        {isCreateCard && (
          <Ionicons name="ellipsis-vertical" size={16} color="rgba(255, 255, 255, 0.8)" />
        )}
      </View>
    </View>

      <View style={[styles.whiteHabitCardProgress, { backgroundColor: progressTrackColor }]}>
        <Animated.View
          style={[
            styles.whiteHabitCardProgressFill,
            {
              width: animatedWidth,
              backgroundColor: progressFillColor,
            },
          ]}
        />
      </View>

      {!isCreateCard && (
        <View style={{ 
          marginBottom: 12, 
          marginTop: 8, 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 10,
          paddingHorizontal: 4 
        }}>
          {partnership ? (
            <>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); Alert.alert('Partner', `Tracking with ${partnership.partner?.username || 'Friend'}`); }}>
                <Image 
                  source={{ uri: partnership.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: iconColor }}
                />
              </TouchableOpacity>
              
              <View style={{ flex: 1, justifyContent: 'center', minHeight: 28, zIndex: 999, elevation: 5 }}>
                {partnerStatus?.completed ? (
                  <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
                    Completed today ✓
                  </Text>
                ) : (canNudge || !timeRemaining) ? (
                  <TouchableOpacity 
                    onPress={async (e) => { e.stopPropagation(); await onNudge(); }}
                    activeOpacity={0.7}
                    style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 6, 
                      backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9', 
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isCompleted ? 'rgba(255, 255, 255, 0.4)' : '#E2E8F0',
                      alignSelf: 'flex-start',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: isCompleted ? '#FFFFFF' : '#0F172A', fontSize: 11, fontWeight: '700' }}>
                      Nudge
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: isCompleted ? 'rgba(255,255,255,0.9)' : '#334155', fontSize: 11, fontWeight: '600' }}>
                    Next nudge {timeRemaining}
                  </Text>
                )}
              </View>
            </>
          ) : pendingInvite ? (
            <>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); Alert.alert('Pending Invite', `Waiting for ${pendingInvite.partner?.username || 'Friend'} to accept`); }}>
                <Image 
                  source={{ uri: pendingInvite.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1, borderColor: iconColor, opacity: 0.6 }}
                />
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 11, fontStyle: 'italic', marginRight: 8 }}>
                  Pending...
                </Text>
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); onCancelInvite(); }}
                  style={{ 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    backgroundColor: 'rgba(248, 113, 113, 0.15)',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); onInvite(); }}>
                <Ionicons name="person-add-outline" size={20} color={iconColor} />
              </TouchableOpacity>
              <Text style={{ color: '#64748B', fontSize: 11 }}>
                Invite friend
              </Text>
            </>
          )}
        </View>
      )}

      <View style={styles.whiteHabitCardMetricRow}>
        <Text style={[styles.whiteHabitCardMetricLabel, { color: subtitleColor }]}>{card.metricLabel}</Text>
        <Text style={[styles.whiteHabitCardMetricValue, { color: titleColor }]}>{card.metricValue}</Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

export default WhiteHabitCard;

