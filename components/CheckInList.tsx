import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { calculateCompletionPercentage } from '../lib/goalHelpers';

interface CheckInListProps {
  userGoals: any[];
  overdueGoals: Set<string>;
  checkedInGoals: Set<string>;
  overdueGoalDates: {[goalId: string]: Date};
  overdueGoalCounts: {[goalId: string]: number};
  goalProgress: {[goalId: string]: number};
  theme: any;
  user: any;
  onCheckInPress: (goal: any, dayOfWeek: number) => void;
  onGoalPress: (goal: any, onCheckInDeleted: () => void) => void;
  styles: any;
}

function CheckInList({
  userGoals,
  overdueGoals,
  checkedInGoals,
  overdueGoalDates,
  overdueGoalCounts,
  goalProgress,
  theme,
  user,
  onCheckInPress,
  onGoalPress,
  styles
}: CheckInListProps) {
  
  // Helper functions moved from ActionScreen
  const isGoalOverdue = (goal: any, overdueGoals: Set<string>): boolean => {
    if (!goal.frequency || goal.completed) return false;
    return overdueGoals.has(goal.id);
  };

  const isGoalDueToday = (goal: any, checkedInGoals: Set<string>): boolean => {
    if (!goal.frequency || goal.completed) return false;
    
    const hasFrequency = goal.frequency.some((day: boolean) => day);
    if (!hasFrequency) return false;
    
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    
    // Due today = required today AND not checked in today
    return goal.frequency[todayDayOfWeek] && !checkedInGoals.has(goal.id);
  };

  if (userGoals.length === 0) {
    return null;
  }
  
  // Get all goals that need check-ins - show separate items for overdue vs due today
  const overdueGoalsList = userGoals.filter(goal => isGoalOverdue(goal, overdueGoals));
  const dueTodayGoalsList = userGoals.filter(goal => isGoalDueToday(goal, checkedInGoals));
  
  // Create separate check-in items: overdue items first, then due today items
  const overdueItems = overdueGoalsList.map(goal => ({...goal, checkInType: 'overdue'}));
  const dueTodayItems = dueTodayGoalsList.map(goal => ({...goal, checkInType: 'due_today'}));
  const allCheckInGoals = [...overdueItems, ...dueTodayItems];

  if (allCheckInGoals.length > 0) {
    return (
      <>
        {allCheckInGoals.map(goal => (
          <TouchableOpacity 
            key={`checkin-${goal.id}-${goal.checkInType}`} 
            style={styles.checkinItem}
            onPress={() => {
              if (goal.checkInType === 'overdue') {
                const oldestMissedDate = overdueGoalDates[goal.id];
                if (oldestMissedDate) {
                  onCheckInPress({...goal, overdueDate: oldestMissedDate}, oldestMissedDate.getDay());
                } else {
                  onCheckInPress(goal, new Date().getDay());
                }
              } else if (goal.checkInType === 'due_today') {
                onCheckInPress(goal, new Date().getDay());
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.checkinItemLeft}>
              <TouchableOpacity 
                style={[styles.circularProgressContainer, { marginRight: 16 }]}
                onPress={() => {
                  onGoalPress(goal, async () => {
                    // Refresh callback - handled in parent
                  });
                }}
                activeOpacity={0.7}
              >
                <Svg width={40} height={40}>
                  <Defs>
                    <LinearGradient id={`gradient-${goal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#FF6B35" />
                      <Stop offset="50%" stopColor="#9C27B0" />
                      <Stop offset="100%" stopColor="#E91E63" />
                    </LinearGradient>
                  </Defs>
                  {/* Background circle */}
                  <Circle
                    cx={20}
                    cy={20}
                    r={16}
                    stroke="rgba(128, 128, 128, 0.3)"
                    strokeWidth={3}
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  <Circle
                    cx={20}
                    cy={20}
                    r={16}
                    stroke={`url(#gradient-${goal.id})`}
                    strokeWidth={3}
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - (() => {
                      const checkInCount = goalProgress[goal.id] || 0;
                      const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                        id: `mock-${index}`,
                        goal_id: goal.id,
                        user_id: user?.id || '',
                        completed_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                      }));
                      return Math.round(calculateCompletionPercentage(goal, mockProgressEntries));
                    })() / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                  />
                </Svg>
                <View style={styles.circularProgressText}>
                  <Text style={[styles.circularProgressValue, { color: theme.textPrimary }]}>
                    {(() => {
                      const checkInCount = goalProgress[goal.id] || 0;
                      const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                        id: `mock-${index}`,
                        goal_id: goal.id,
                        user_id: user?.id || '',
                        completed_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                      }));
                      return Math.round(calculateCompletionPercentage(goal, mockProgressEntries));
                    })()}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.checkinItemContent}>
                <Text style={[styles.checkinItemTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
                <Text style={[styles.checkinItemCategory, { color: theme.textSecondary }]}>
                  {(() => {
                    if (goal.checkInType === 'overdue') {
                      const oldestMissedDate = overdueGoalDates[goal.id];
                      const overdueCount = overdueGoalCounts[goal.id];
                      
                      if (oldestMissedDate && overdueCount) {
                        const todayDate = new Date();
                        const diffTime = todayDate.getTime() - oldestMissedDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                       
                        return `${overdueCount} overdue, oldest ${diffDays}d`;
                      }
                     
                      return 'Check-in overdue';
                    } else if (goal.checkInType === 'due_today') {
                      return 'Check-in due today';
                    }
                    return '';
                  })()}
                </Text>
              </View>
            </View>
            <View style={styles.checkinItemRight}>
              {(() => {
                if (goal.checkInType === 'overdue') {
                  return (
                    <View style={styles.overdueIndicator}>
                      <Ionicons name="alert" size={20} color="#EF4444" />
                    </View>
                  );
                } else if (goal.checkInType === 'due_today') {
                  return (
                    <View style={styles.todayIndicator}>
                      <Ionicons name="time-outline" size={20} color="#3B82F6" />
                    </View>
                  );
                }
                return null;
              })()}
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  }
  
  return (
    <View style={styles.noCheckinsContainer}>
      <Ionicons name="calendar-outline" size={24} color={theme.textSecondary} />
      <Text style={[styles.noCheckinsText, { color: theme.textSecondary }]}>No check-ins scheduled for today</Text>
      <Text style={[styles.noCheckinsSubtext, { color: theme.textTertiary }]}>Create goals and set frequency to see them here</Text>
    </View>
  );
}

export default memo(CheckInList); 