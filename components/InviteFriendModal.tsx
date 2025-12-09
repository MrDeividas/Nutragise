import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { socialService } from '../lib/socialService';
import { habitInviteService } from '../lib/habitInviteService';
import { Profile } from '../lib/socialService';

interface InviteFriendModalProps {
  visible: boolean;
  onClose: () => void;
  habitType: 'core' | 'custom';
  habitIdentifier: string; // habit_key or custom_habit_id
  habitTitle: string;
}

export default function InviteFriendModal({
  visible,
  onClose,
  habitType,
  habitIdentifier,
  habitTitle
}: InviteFriendModalProps) {
  const { theme, isDark } = useThemeStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'supportive' | 'competitive'>('supportive');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  // Load following list on mount and ensure mode is supportive
  useEffect(() => {
    if (visible && user) {
      loadFollowing();
      setMode('supportive'); // Always default to supportive (competitive coming soon)
    }
  }, [visible, user]);

  const loadFollowing = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await socialService.getFollowing(user.id);
      setFollowing(data);
      setSearchResults(data); // Default to showing following
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setSearchResults(following);
      return;
    }
    
    try {
      setIsLoading(true);
      // Search both global users and filter following locally for better UX
      // Ideally, just filter following list first as you likely invite friends
      const filtered = following.filter(p => 
        p.username.toLowerCase().includes(text.toLowerCase()) || 
        (p.display_name && p.display_name.toLowerCase().includes(text.toLowerCase()))
      );
      
      if (filtered.length > 0) {
        setSearchResults(filtered);
      } else {
        // If not in following, search global
        const globalResults = await socialService.searchUsers(text);
        setSearchResults(globalResults.filter(u => u.id !== user?.id));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (inviteeId: string) => {
    if (!user) return;
    
    try {
      setSendingInvite(inviteeId);
      await habitInviteService.sendHabitInvite(
        user.id,
        inviteeId,
        habitType,
        habitIdentifier,
        mode
      );
      
      Alert.alert(
        'Invite Sent!',
        `Invitation to join ${habitTitle} has been sent.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    } finally {
      setSendingInvite(null);
    }
  };

  const renderUserItem = ({ item }: { item: Profile }) => (
    <View style={[styles.userItem, { borderBottomColor: theme.border }]}>
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: theme.textPrimary }]}>{item.username}</Text>
        {item.display_name && (
          <Text style={[styles.displayName, { color: theme.textSecondary }]}>{item.display_name}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.inviteButton, { backgroundColor: theme.primary }]}
        onPress={() => handleInvite(item.id)}
        disabled={sendingInvite === item.id}
      >
        {sendingInvite === item.id ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.inviteButtonText}>Invite</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dimmedBackground, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' }]} />
        
        <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: theme.border }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Invite Partner</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Invite a friend to track <Text style={{ fontWeight: 'bold', color: theme.textPrimary }}>{habitTitle}</Text> together.
            </Text>

            {/* Mode Selection */}
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  { 
                    borderColor: mode === 'supportive' ? theme.primary : theme.border,
                    backgroundColor: mode === 'supportive' ? (isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4') : 'transparent'
                  }
                ]}
                onPress={() => setMode('supportive')}
              >
                <Ionicons 
                  name="heart" 
                  size={24} 
                  color={mode === 'supportive' ? theme.primary : theme.textSecondary} 
                />
                <Text style={[
                  styles.modeTitle, 
                  { color: mode === 'supportive' ? theme.primary : theme.textPrimary }
                ]}>
                  Supportive
                </Text>
                <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
                  Encourage each other without pressure.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeOption,
                  { 
                    borderColor: theme.border,
                    backgroundColor: 'transparent',
                    opacity: 0.5
                  }
                ]}
                disabled={true}
              >
                <Ionicons 
                  name="trophy" 
                  size={24} 
                  color={theme.textSecondary} 
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[
                    styles.modeTitle, 
                    { color: theme.textPrimary }
                  ]}>
                    Competitive
                  </Text>
                  <View style={{ 
                    backgroundColor: theme.primary, 
                    paddingHorizontal: 6, 
                    paddingVertical: 2, 
                    borderRadius: 8 
                  }}>
                    <Text style={{ 
                      color: '#FFFFFF', 
                      fontSize: 10, 
                      fontWeight: '600' 
                    }}>
                      Coming Soon
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modeDescription, { color: theme.textSecondary }]}>
                  Track streaks and compete daily.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search friends..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Results */}
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                !isLoading ? (
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No users found. Try searching for a username.
                  </Text>
                ) : (
                  <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                )
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimmedBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    width: '90%',
    maxWidth: 400,
    height: '70%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 14,
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});

