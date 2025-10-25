import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../state/themeStore';
import { DailyHabits } from '../types/database';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  data: DailyHabits | null;
  onHabitPress: (habitType: string) => void;
  selectedHabits?: string[];
  completedCount?: number;
  onEditPress?: () => void;
  enabledTodaySet?: Set<string>;
  onUnlockToday?: (habitId: string) => void;
}

export const AVAILABLE_HABITS = [
  { id: 'gym', name: 'Gym', icon: { name: 'dumbbell', solid: false } },
  { id: 'run', name: 'Run', icon: { name: 'running', solid: false } },
  { id: 'sleep', name: 'Sleep', icon: { name: 'moon', solid: false } },
  { id: 'water', name: 'Water', icon: { name: 'tint', solid: false } },
  { id: 'reflect', name: 'Reflect', icon: { name: 'star', solid: true } },
  { id: 'focus', name: 'Focus', icon: { name: 'crosshairs', solid: false } },
  { id: 'update_goal', name: 'Update Goal', icon: { name: 'flag', solid: false } },
  { id: 'meditation', name: 'Meditation', icon: { name: 'om', solid: false } },
  { id: 'microlearn', name: 'Microlearn', icon: { name: 'book', solid: false } },
  { id: 'cold_shower', name: 'Cold Shower', icon: { name: 'snowflake', solid: false } },
  { id: 'screen_time', name: 'Screen Time Limit', icon: { name: 'mobile-alt', solid: false } }
];

export const DEFAULT_HABITS = ['gym', 'reflect', 'focus', 'sleep', 'water', 'run', 'microlearn', 'cold_shower'];


// Segmented Ring Component
function SegmentedRing({ 
  theme, 
  selectedHabits = DEFAULT_HABITS,
  completedCount = 0,
  onEditPress,
  onHabitPress,
  enabledTodaySet = new Set(),
  onUnlockToday,
  completedHabits = new Set()
}: { 
  theme: any; 
  selectedHabits?: string[]; 
  completedCount?: number;
  onEditPress?: () => void;
  onHabitPress?: (habitType: string) => void;
  enabledTodaySet?: Set<string>;
  onUnlockToday?: (habitId: string) => void;
  completedHabits?: Set<string>;
}) {

  const icons = selectedHabits
    .map(id => AVAILABLE_HABITS.find(h => h.id === id))
    .filter(Boolean)
    .map(h => h!.icon);

  const centerX = 180;
  const centerY = 180;
  const outerRadius = 150;
  const innerRadius = 105;
  const segmentCount = selectedHabits.length;
  const gapAngle = 5; // Gap between segments is 5 degrees
  const segmentAngle = (360 - segmentCount * gapAngle) / segmentCount;
  const totalAngle = segmentAngle + gapAngle; // Total angle per segment including gap

  const toggleHabit = (habitId: string) => {
    // Call the onHabitPress callback if provided
    if (onHabitPress) {
      onHabitPress(habitId);
    }
  };

  const createSegmentPath = (index: number) => {
    const startAngle = (index * totalAngle - 90) * (Math.PI / 180);
    const endAngle = (index * totalAngle + segmentAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);
    
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);
    
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  return (
    <View style={styles.ringContainer}>
      <Svg width={360} height={360}>
        <Defs>
          {/* Glass morphism gradient for uncompleted segments */}
          <LinearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Dynamic ring segments */}
        {Array.from({ length: segmentCount }).map((_, index) => {
          const habitId = selectedHabits[index];
          const isCompleted = completedHabits.has(habitId);
          const isEnabled = enabledTodaySet.has(habitId);
          const isNotScheduled = !isEnabled;
          
          return (
            <Path
              key={index}
              d={createSegmentPath(index)}
              stroke={isCompleted ? '#10B981' : (isNotScheduled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.2)')}
              strokeWidth={1}
              fill={isCompleted ? '#10B981' : 'url(#glassGradient)'}
              opacity={isNotScheduled && !isCompleted ? 0.5 : 1}
            />
          );
        })}
      </Svg>
      
      {/* Icons positioned around the ring */}
      {icons.map((icon, index) => {
        const habitId = selectedHabits[index];
        const isCompleted = completedHabits.has(habitId);
        const isEnabled = enabledTodaySet.has(habitId);
        const isNotScheduled = !isEnabled;
        const angle = (index * totalAngle + segmentAngle / 2) - 90; // Center of each segment
        const radius = 127.5; // Distance from center (between inner and outer radius)
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;
        
        const handlePress = () => {
          if (isNotScheduled && onUnlockToday) {
            // Show unlock confirmation
            Alert.alert(
              'Habit Not Scheduled',
              'This habit is not scheduled for today. Would you like to log it anyway?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Log Today', 
                  onPress: () => onUnlockToday(habitId),
                  style: 'default'
                }
              ]
            );
          } else {
            // Open the modal/screen for this habit
            if (onHabitPress) {
              onHabitPress(habitId);
            }
          }
        };
        
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.iconContainer,
              {
                left: centerX + x - 12, // Center at 180, offset by icon size
                top: centerY + y - 12,
                opacity: isNotScheduled ? 0.4 : 1, // Dim non-scheduled habits
              }
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <FontAwesome5 
              name={icon.name} 
              size={18} 
              color={isCompleted ? '#FFFFFF' : '#10B981'}
              solid={icon.solid}
            />
          </TouchableOpacity>
        );
      })}
      
      {/* Central text */}
      <TouchableOpacity 
        style={styles.centralTextContainer}
        onPress={onEditPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.centralTitle, { color: theme.textPrimary }]}>Today's</Text>
        <Text style={[styles.centralTitle, { color: theme.textPrimary }]}>Scheduled Habits</Text>
        <Text style={[styles.centralSubtitle, { color: theme.textSecondary }]}>
          {completedHabits.size}/{enabledTodaySet.size} Completed
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DailyHabitsSummary({ 
  data, 
  onHabitPress, 
  selectedHabits = DEFAULT_HABITS, 
  completedCount = 0, 
  onEditPress,
  enabledTodaySet = new Set(),
  onUnlockToday,
  completedHabits = new Set()
}: {
  data: any;
  onHabitPress?: (habitType: string) => void;
  selectedHabits?: string[];
  completedCount?: number;
  onEditPress?: () => void;
  enabledTodaySet?: Set<string>;
  onUnlockToday?: (habitId: string) => void;
  completedHabits?: Set<string>;
}) {
  const { theme } = useTheme();

  return (
    <View>
      {/* Segmented Ring Component Only */}
      <View style={styles.circularWrapper}>
        <SegmentedRing 
          theme={theme} 
          selectedHabits={selectedHabits}
          completedCount={completedCount}
          onEditPress={onEditPress}
          onHabitPress={onHabitPress}
          enabledTodaySet={enabledTodaySet}
          onUnlockToday={onUnlockToday}
          completedHabits={completedHabits}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Ring component styles
  circularWrapper: {
    marginHorizontal: 16,
    padding: 45,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 420,
  },
  ringContainer: {
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // No background, no border, just text positioning
  },
  centralTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  centralSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 