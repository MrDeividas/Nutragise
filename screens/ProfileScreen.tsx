import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  PanResponder,
  Dimensions
} from 'react-native';
import { useAuthStore } from '../state/authStore';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [showDayOverlay, setShowDayOverlay] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const weeklyTrackerRef = useRef<View>(null);
  const weeklyTrackerLayout = useRef<any>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getDayContent = (dayIndex: number) => {
    // For now, return no goals message. Later this can be connected to real data
    return {
      day: days[dayIndex],
      goals: [],
      message: 'No goals for today'
    };
  };

  const calculateDayFromPosition = (x: number, containerX: number, containerWidth: number) => {
    const relativeX = x - containerX;
    const dayWidth = containerWidth / 7;
    const dayIndex = Math.floor(relativeX / dayWidth);
    return Math.max(0, Math.min(6, dayIndex));
  };

  // Mock data for now - will be replaced with real data later
  const tasks = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'];
  const goals = [
    { icon: '📖', title: 'Read 10 books this year', percent: 80 },
    { icon: '🏃‍♂️', title: 'Run a marathon', percent: 50 },
    { icon: '🌐', title: 'Learn a new language', percent: 25 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with Settings */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {user?.username || 'User'}
          </Text>
          <Text style={styles.username}>
            @{user?.username || 'username'}
          </Text>
          <Text style={styles.joinDate}>
            Joined {new Date(user?.created_at || Date.now()).getFullYear()}
          </Text>
          {user?.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
        </View>

        {/* Keep Track Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keep track</Text>
          <View style={styles.keepTrackContainer}>
            <View 
              style={styles.weeklyTracker}
              ref={weeklyTrackerRef}
              onLayout={(event) => {
                weeklyTrackerLayout.current = event.nativeEvent.layout;
              }}
              {...PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => {
                  const { pageX, pageY } = evt.nativeEvent;
                  if (weeklyTrackerLayout.current) {
                    const dayIndex = calculateDayFromPosition(pageX, weeklyTrackerLayout.current.x, weeklyTrackerLayout.current.width);
                    setSelectedDayIndex(dayIndex);
                    setOverlayPosition({ x: pageX, y: pageY });
                    setShowDayOverlay(true);
                  }
                },
                onPanResponderMove: (evt) => {
                  const { pageX, pageY } = evt.nativeEvent;
                  if (weeklyTrackerLayout.current) {
                    const dayIndex = calculateDayFromPosition(pageX, weeklyTrackerLayout.current.x, weeklyTrackerLayout.current.width);
                    setSelectedDayIndex(dayIndex);
                    setOverlayPosition({ x: pageX, y: pageY });
                  }
                },
                onPanResponderRelease: () => {
                  setShowDayOverlay(false);
                },
                onPanResponderTerminate: () => {
                  setShowDayOverlay(false);
                },
              }).panHandlers}
            >
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                // Mock data - you can replace this with real tracking data
                const isCompleted = index === 0 || index === 1; // Sunday and Monday completed
                const isToday = index === new Date().getDay(); // Get current day of week (0=Sunday, 6=Saturday)
                
                return (
                  <React.Fragment key={index}>
                    <View style={[styles.dayContainer, isToday && styles.todayContainer]}>
                      {isToday && (
                        <View style={styles.todayBorderFade}>
                          {/* Single curved line */}
                          <View style={styles.singleCurvedLine} />
                          {/* Gradient fade overlays at top end */}
                          <View style={styles.topFade1} />
                          <View style={styles.topFade2} />
                          <View style={styles.topFade3} />
                          <View style={styles.topFade4} />
                          <View style={styles.topFade5} />
                          {/* Gradient fade overlays at right end */}
                          <View style={styles.rightFade1} />
                          <View style={styles.rightFade2} />
                          <View style={styles.rightFade3} />
                          <View style={styles.rightFade4} />
                          <View style={styles.rightFade5} />
                        </View>
                      )}
                      <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day}</Text>
                      <TouchableOpacity 
                        style={styles.dayCircle}
                      >
                        {isCompleted ? (
                          <View style={styles.innerCircle}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        ) : (
                          <Text style={styles.plusSign}>+</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {/* Separator line between days (except after last day and between T W T) */}
                    {index < 6 && index !== 2 && index !== 3 && (
                      <>
                        {(index === 0 || index === 5) ? (
                          <View style={styles.fadeSeparator}>
                            <View style={styles.fadeSegment1} />
                            <View style={styles.fadeSegment2} />
                            <View style={styles.fadeSegment3} />
                            <View style={styles.fadeSegment4} />
                            <View style={styles.fadeSegment5} />
                            <View style={styles.fadeSegment6} />
                            <View style={styles.fadeSegment7} />
                            <View style={styles.fadeSegment8} />
                          </View>
                        ) : (
                          <View style={styles.solidFadeSeparator}>
                            <View style={styles.solidFadeTop} />
                            <View style={styles.solidFadeMiddle} />
                            <View style={styles.solidFadeBottom} />
                          </View>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <View style={styles.tasksContainer}>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskPill}>
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.goalsContainer}>
            {goals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${goal.percent}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>{goal.percent}</Text>
                  </View>
                  <Text style={styles.progressLabel}>{goal.percent}% completed</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Day Overlay Modal */}
      <Modal
        visible={showDayOverlay}
        transparent={true}
        animationType="none"
        pointerEvents="auto"
        onRequestClose={() => setShowDayOverlay(false)}
      >
        <TouchableOpacity 
          style={styles.overlayContainer}
          activeOpacity={1}
          onPress={() => setShowDayOverlay(false)}
        >
          <View 
            style={[
              styles.dayOverlay,
              {
                left: 24,
                right: 24,
                top: overlayPosition.y - 80,
              }
            ]}
          >
            <Text style={styles.overlayDayName}>{getDayContent(selectedDayIndex).day}</Text>
            <Text style={styles.overlayMessage}>{getDayContent(selectedDayIndex).message}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingsIcon: {
    fontSize: 20,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3c6a7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  tasksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#129490',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Keep Track Section Styles
  keepTrackContainer: {
    gap: 16,
  },
  weeklyTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  todayContainer: {
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  todayBorderFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
  },
  // Single curved line following the 16px border radius
  singleCurvedLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'transparent',
    borderTopColor: '#1f2937',
    borderRightColor: '#1f2937',
    borderTopRightRadius: 16,
    opacity: 0.25,
  },
  // Gradient fade overlays for top end
  topFade1: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  topFade2: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  topFade3: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  topFade4: {
    position: 'absolute',
    top: 0,
    right: 28,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  topFade5: {
    position: 'absolute',
    top: 0,
    right: 32,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  // Gradient fade overlays for right end
  rightFade1: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  rightFade2: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  rightFade3: {
    position: 'absolute',
    top: 24,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  rightFade4: {
    position: 'absolute',
    top: 28,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  rightFade5: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#129490',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  plusSign: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6b7280',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#1f2937',
    alignSelf: 'center',
    opacity: 0.2,
  },
  fadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  fadeSegment1: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  fadeSegment2: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment3: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment4: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment5: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment6: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment7: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment8: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  solidFadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  solidFadeTop: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  solidFadeMiddle: {
    width: 1,
    height: 32,
    backgroundColor: '#1f2937',
    opacity: 0.2,
  },
  solidFadeBottom: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  // Overlay styles
  overlayContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dayOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  overlayMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 