import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { habitsService } from '../lib/habitsService';

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
  partnerStatus: any;
  onInvite: () => void;
  onRemovePartner: () => void;
  styles: any;
}

const WhiteHabitCard = React.memo(({ 
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
  partnerStatus,
  onInvite,
  onRemovePartner,
  styles
}: WhiteHabitCardProps) => {
  const isCreateCard = card.key === 'create_new_habit';
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressAnimated] = useState(new Animated.Value(card.progress ?? 0));
  const [expandAnimation] = useState(new Animated.Value(0));
  const [monthCompletions, setMonthCompletions] = useState<{ [date: string]: 'completed' | 'skipped' | 'missed' }>({});
  
  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: card.progress ?? 0,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [card.progress, progressAnimated]);

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnimation]);

  const { user } = useAuthStore();

  // Fetch completions for current month when expanded
  useEffect(() => {
    if (isExpanded && !isCreateCard && card.habit && user) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      habitsService.fetchCompletionsForMonth(user.id, card.habit.id, year, month)
        .then(completions => {
          const completionMap: { [date: string]: 'completed' | 'skipped' | 'missed' } = {};
          completions.forEach(completion => {
            const date = new Date(completion.occur_date).getDate();
            completionMap[date] = completion.status;
          });
          setMonthCompletions(completionMap);
        })
        .catch(error => {
          console.error('Error fetching month completions:', error);
        });
    } else {
      setMonthCompletions({});
    }
  }, [isExpanded, isCreateCard, card.habit, user]);

  const animatedWidth = progressAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleCardPress = useCallback(() => {
    if (isCreateCard) {
      setShowCustomHabitModal(true);
    }
  }, [isCreateCard, setShowCustomHabitModal]);

  const handleHeaderPress = useCallback((e: any) => {
    if (!isCreateCard && card.habit) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }
  }, [isCreateCard, card.habit, isExpanded]);

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

  const animatedBackgroundColor = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [cardBackgroundColor, isCreateCard ? '#9CA3AF' : card.accent],
  });
  
  return (
    <Animated.View
      style={[
        styles.whiteHabitCard,
        {
          width: spotlightCardWidth,
          marginRight: index === totalCards - 1 ? 0 : 12,
          marginVertical: 8,
          shadowColor: whiteCardShadowColor,
          backgroundColor: animatedBackgroundColor,
          borderColor: isCompleted ? 'transparent' : '#E5E7EB',
        },
        !isCreateCard && customHabitsLoading && styles.whiteHabitCardDisabled,
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.85}
        onPress={isCreateCard ? handleCardPress : handleHeaderPress}
        onLongPress={handleCardLongPress}
        delayLongPress={250}
        disabled={!isCreateCard && customHabitsLoading}
        style={{ flex: 1 }}
      >
      <View style={[styles.whiteHabitCardHeader, { 
        backgroundColor: isCreateCard ? '#9CA3AF' : card.accent, 
        borderRadius: 20,
        marginBottom: isExpanded ? 4 : 16,
        alignItems: isExpanded ? 'center' : 'flex-start'
      }]}>
        <View style={{ alignItems: isExpanded ? 'center' : 'flex-start' }}>
          <Text style={[styles.whiteHabitCardTitle, { color: isCreateCard ? '#FFFFFF' : '#FFFFFF' }]}>
            {isExpanded ? new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase() : card.title}
          </Text>
          {!isExpanded && (
            <Text style={[styles.whiteHabitCardSubtitle, { color: isCreateCard ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>{card.subtitle}</Text>
          )}
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

      {!isExpanded && (
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
      )}

      {!isExpanded && !isCreateCard && (
        <View style={{ marginBottom: 8, marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {partnership ? (
            <>
           <TouchableOpacity onPress={(e) => { e.stopPropagation(); Alert.alert('Partner', `Tracking with ${partnership.partner?.username || 'Friend'}`); }}>
             <Image 
               source={{ uri: partnership.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
               style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: iconColor }}
             />
           </TouchableOpacity>
          <Text style={{ color: subtitleColor, fontSize: 11 }}>
            {partnerStatus?.completed ? 'Completed today ✓' : 'Not completed'}
          </Text>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); onInvite(); }}>
                <Ionicons name="person-add-outline" size={20} color={iconColor} />
              </TouchableOpacity>
              <Text style={{ color: subtitleColor, fontSize: 11 }}>
                Invite friend
              </Text>
            </>
          )}
        </View>
      )}

      {!isExpanded && (
      <View style={styles.whiteHabitCardMetricRow}>
        <Text style={[styles.whiteHabitCardMetricLabel, { color: subtitleColor }]}>{card.metricLabel}</Text>
        <Text style={[styles.whiteHabitCardMetricValue, { color: titleColor }]}>{card.metricValue}</Text>
      </View>
      )}

      {isExpanded && !isCreateCard && (
        <View style={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, marginTop: -12 }}>
          {/* Calendar Grid */}
          <View>
            <View style={{ flexDirection: 'row', marginBottom: 1 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600' }}>{day}</Text>
                </View>
              ))}
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const today = new Date().getDate();
                const isPast = day < today;
                const isToday = day === today;
                const isFuture = day > today;
                
                // Get real completion status from database
                const completionStatus = monthCompletions[day];
                const isCompleted = completionStatus === 'completed';
                const isMissed = isPast && (completionStatus === 'missed' || (!completionStatus && isPast));
                
                return (
                  <View key={i} style={{ width: '14.28%', alignItems: 'center', justifyContent: 'center', paddingVertical: 1 }}>
                    {isFuture ? (
                      <View style={{ width: 15, height: 15, borderRadius: 7.5, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                    ) : isCompleted ? (
                      <View style={{ width: 15, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    ) : isMissed ? (
                      <View style={{ width: 15, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="close" size={11} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={{ width: 15, height: 15, borderRadius: 7.5, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1.5, borderColor: '#FFFFFF' }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
    </Animated.View>
  );
});

export default WhiteHabitCard;

