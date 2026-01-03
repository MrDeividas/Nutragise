import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

interface AnimatedHabitCardProps {
  card: any;
  index: number;
  totalCards: number;
  spotlightCardWidth: number;
  cardState: any;
  isDark: boolean;
  cardBackgroundColor: string;
  progressTrackColor: string;
  progressFillColor: string;
  subtitleColor: string;
  showPendingIndicator: boolean;
  progressWidth: any;
  handleHabitPress: (habitId: string) => void;
  handleHabitLongPress: (habitId: string) => void;
  cardAnimations: any;
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

const AnimatedHabitCard = ({
  card,
  index,
  totalCards,
  spotlightCardWidth,
  cardState,
  isDark,
  cardBackgroundColor,
  progressTrackColor,
  progressFillColor,
  subtitleColor,
  showPendingIndicator,
  progressWidth,
  handleHabitPress,
  handleHabitLongPress,
  cardAnimations,
  partnership,
  pendingInvite,
  partnerStatus,
  onInvite,
  onRemovePartner,
  onCancelInvite,
  onNudge,
  lastNudgeTime,
  styles
}: AnimatedHabitCardProps) => {
  const anim = cardAnimations[card.key];
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canNudge, setCanNudge] = useState(true);
  
  useEffect(() => {
    console.log('[AnimatedHabitCard] lastNudgeTime changed:', lastNudgeTime);
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
        console.log('[AnimatedHabitCard] Timer expired, showing nudge button');
      } else {
        setCanNudge(false);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const remaining = `${hours}h ${minutes}m`;
        setTimeRemaining(remaining);
        console.log('[AnimatedHabitCard] Timer active, remaining:', remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastNudgeTime]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: anim.scale.value },
        { translateX: anim.translateX.value },
      ],
    };
  }, [anim]);
  
  return (
    <Reanimated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={250}
        onPress={() => handleHabitPress(card.habitId)}
        onLongPress={() => handleHabitLongPress(card.habitId)}
        style={[
          styles.highlightCard,
          {
            width: spotlightCardWidth,
            marginRight: index === totalCards - 1 ? 0 : 10,
            backgroundColor: cardBackgroundColor,
            shadowColor: cardState?.completed ? '#065f46' : isDark ? '#000000' : '#94a3b8',
          },
        ]}
      >
        <View style={styles.highlightCardHeader}>
          <View>
            <View style={styles.highlightCardTitleRow}>
              <Text style={[styles.highlightCardTitle, { color: '#ffffff' }]}>{card.title}</Text>
              {showPendingIndicator && (
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#F87171"
                  style={styles.pendingIndicatorIcon}
                />
              )}
            </View>
            <Text style={[styles.highlightCardSubtitle, { color: subtitleColor }]}>{card.subtitle}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {partnership ? (
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemovePartner(); }}>
                <Ionicons name="ellipsis-vertical" size={16} color="rgba(255, 255, 255, 0.65)" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="ellipsis-vertical" size={16} color="rgba(255, 255, 255, 0.65)" />
            )}
          </View>
        </View>

        <View style={[styles.highlightCardProgress, { backgroundColor: progressTrackColor }]}>
          <Reanimated.View
            style={[
              styles.highlightCardProgressFill,
              {
                width: progressWidth,
                backgroundColor: progressFillColor,
              },
            ]}
          />
        </View>

        {partnership ? (
          <View style={{ marginBottom: 8, marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); Alert.alert('Partner', `Tracking with ${partnership.partner?.username || 'Friend'}`); }}>
              <Image 
                source={{ uri: partnership.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
                style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
              />
            </TouchableOpacity>
            {partnerStatus?.completed ? (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                Completed today ✓
              </Text>
            ) : canNudge ? (
              <TouchableOpacity 
                onPress={async (e) => { e.stopPropagation(); await onNudge(); }}
                style={{ 
                  paddingHorizontal: 10, 
                  paddingVertical: 4, 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>
                  Nudge
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                Next nudge {timeRemaining}
              </Text>
            )}
          </View>
        ) : pendingInvite ? (
          <View style={{ marginBottom: 8, marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); Alert.alert('Pending Invite', `Waiting for ${pendingInvite.partner?.username || 'Friend'} to accept`); }}>
              <Image 
                source={{ uri: pendingInvite.partner?.avatar_url || 'https://via.placeholder.com/24' }} 
                style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', opacity: 0.6 }}
              />
            </TouchableOpacity>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontStyle: 'italic' }}>
              Pending...
            </Text>
            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); onCancelInvite(); }}
              style={{ 
                paddingHorizontal: 8, 
                paddingVertical: 3, 
                backgroundColor: 'rgba(248, 113, 113, 0.2)',
                borderRadius: 8,
                marginLeft: 4
              }}
            >
              <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: 8, marginTop: -8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onInvite(); }}>
              <Ionicons name="person-add-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              Invite friend
            </Text>
          </View>
        )}

        <View style={styles.highlightCardMetricRow}>
          <Text style={[styles.highlightCardMetricLabel, { color: subtitleColor }]}>{card.metricLabel}</Text>
          <Text style={[styles.highlightCardMetricValue, { color: '#ffffff' }]}>{card.metricValue}</Text>
        </View>
      </TouchableOpacity>
    </Reanimated.View>
  );
};

export default AnimatedHabitCard;

