import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

import { supabase } from '../lib/supabase';
import { stripeService } from '../lib/stripeService';
import { adminService } from '../lib/adminService';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, signOut, resendVerificationEmail, checkEmailVerification } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check email verification status
  const checkEmailStatus = async () => {
    const verified = await checkEmailVerification();
    setEmailVerified(verified);
  };

  // Load user profile to check is_pro status
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Check admin status
  const checkAdminStatus = async () => {
    if (!user?.id) return;
    try {
      const admin = await adminService.isAdmin(user.id);
      setIsAdmin(admin);
      // Debug: Log admin status (remove in production)
      if (__DEV__) {
        console.log('Admin status check:', { userId: user.id, isAdmin: admin });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Check on mount and when screen comes into focus
  useEffect(() => {
    checkEmailStatus();
    loadUserProfile();
    checkAdminStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkEmailStatus();
      loadUserProfile();
      checkAdminStatus();
    }, [])
  );

  const handleResendVerification = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address found');
      return;
    }

    setResendingEmail(true);
    const { error } = await resendVerificationEmail(user.email);
    setResendingEmail(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } else {
      Alert.alert(
        'Email Sent',
        'Please check your inbox for the verification email. If you don\'t see it, check your spam folder.'
      );
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  // Handle subscription management
  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      // Get customer portal URL from Stripe
      const portalUrl = await stripeService.getCustomerPortalUrl(user.id);
      
      // Open Customer Portal in browser
      const supported = await Linking.canOpenURL(portalUrl);
      if (supported) {
        await Linking.openURL(portalUrl);
      } else {
        Alert.alert('Error', 'Cannot open subscription management page');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to open subscription management. Please try again.'
      );
    }
  };

  let joinDateText = 'Joined';
  if (user?.created_at) {
    const date = new Date(user.created_at);
    const options = { year: 'numeric', month: 'long' } as const;
    joinDateText = `Joined ${date.toLocaleDateString(undefined, options)}`;
  }
  
  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView 
        contentContainerStyle={[styles.optionsContainer, { paddingBottom: 24 + bottomNavPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Email Verification Reminder */}
        {emailVerified === false && (
          <View style={[styles.emailVerificationContainer, { backgroundColor: 'rgba(255, 193, 7, 0.1)', borderColor: '#FFC107' }]}>
            <View style={styles.emailVerificationContent}>
              <Ionicons name="mail-unread-outline" size={24} color="#FFC107" />
              <View style={styles.emailVerificationText}>
                <Text style={[styles.emailVerificationTitle, { color: '#FFC107' }]}>
                  Verify Your Email
                </Text>
                <Text style={[styles.emailVerificationSubtitle, { color: theme.textSecondary }]}>
                  Please verify your email address to secure your account
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.resendButton, { backgroundColor: '#FFC107' }]}
              onPress={handleResendVerification}
              disabled={resendingEmail}
            >
              {resendingEmail ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={[styles.resendButtonText, { color: '#000' }]}>
                  Resend Email
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Theme Toggle */}
        <View style={[styles.option, styles.optionRow, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionText, { color: theme.textPrimary }]}>Dark Mode</Text>
            <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
              Toggle between light and dark experience
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: 'rgba(15, 122, 120, 0.3)', true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Change Username</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Change Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
          onPress={() => navigation.navigate('ProfileCard')}
        >
          <Text style={[styles.optionText, { color: theme.primary }]}>Change profile card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Notification Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Privacy Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          <Text style={[styles.optionText, { color: theme.primary }]}>Delete Account</Text>
        </TouchableOpacity>
        
        {/* Admin Review - Admin Users Only */}
        {isAdmin && (
          <TouchableOpacity
            style={[styles.option, styles.optionRow, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
            onPress={() => navigation.navigate('AdminReview' as never)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: theme.primary }]}>Admin Review</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Manage Subscription Button - Pro Users Only */}
        {userProfile?.is_pro && (
          <TouchableOpacity
            style={[styles.manageSubscriptionButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
            onPress={handleManageSubscription}
            activeOpacity={0.8}
          >
            <View style={[styles.manageSubscriptionIconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="card-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.manageSubscriptionText, { color: theme.textPrimary }]}>
              Manage Subscription
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        
        {/* Log Out Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.logoutText, { color: '#d32f2f' }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
  },
  optionsContainer: {
    padding: 24,
    gap: 16,
  },
  option: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  joinDate: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emailVerificationContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  emailVerificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailVerificationText: {
    flex: 1,
  },
  emailVerificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emailVerificationSubtitle: {
    fontSize: 14,
  },
  resendButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  manageSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  manageSubscriptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  manageSubscriptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
}); 