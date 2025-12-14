import React from 'react';
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
  partnerStatus: any;
  onInvite: () => void;
  onRemovePartner: () => void;
  styles: any;
}

const AnimatedHabitCard = React.memo(({
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
  partnerStatus,
  onInvite,
  onRemovePartner,
  styles
}: AnimatedHabitCardProps) => {
  const anim = cardAnimations[card.key];
  
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
            marginRight: index === totalCards - 1 ? 0 : 12,
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
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {partnerStatus?.completed ? 'Completed today ✓' : 'Not completed'}
            </Text>
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
});

export default AnimatedHabitCard;

