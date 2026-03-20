import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput, Linking } from 'react-native';
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
  const { theme } = useTheme();
  const { user, updateProfile, signOut, resendVerificationEmail, checkEmailVerification } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUsernameChange, setLastUsernameChange] = useState<Date | null>(null);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [showPaypalEdit, setShowPaypalEdit] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);

  // Check email verification status
  const checkEmailStatus = async () => {
    const verified = await checkEmailVerification();
    setEmailVerified(verified);
  };

  // Load user profile to check is_pro status and last username change
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_pro, username_last_changed, paypal_email')
        .eq('id', user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
        if (profile.username_last_changed) {
          setLastUsernameChange(new Date(profile.username_last_changed));
        }
        if (profile.paypal_email) {
          setPaypalEmail(profile.paypal_email);
        }
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

  // Check if user can change username (30 days restriction)
  const canChangeUsername = (): boolean => {
    if (!lastUsernameChange) return true; // Never changed before
    const daysSinceChange = (Date.now() - lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 30;
  };

  // Handle change username
  const handleChangeUsername = async () => {
    if (!user) return;

    if (!canChangeUsername()) {
      const daysRemaining = Math.ceil(30 - (Date.now() - lastUsernameChange!.getTime()) / (1000 * 60 * 60 * 24));
      Alert.alert(
        'Cannot Change Username',
        `You can only change your username once every 30 days. Please try again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
      );
      return;
    }

    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (newUsername.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    setChangingUsername(true);
    try {
      // Update username in both users and profiles tables
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: newUsername.trim(),
          username_last_changed: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Also update users table if possible
      try {
        await supabase
          .from('users')
          .update({ username: newUsername.trim() })
          .eq('id', user.id);
      } catch (usersError) {
        // Ignore if users table update fails (RLS might block it)
        console.warn('Failed to update users table:', usersError);
      }

      // Update local state
      await updateProfile({ username: newUsername.trim() });
      setLastUsernameChange(new Date());
      setShowChangeUsername(false);
      setNewUsername('');
      await loadUserProfile();
      
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error: any) {
      console.error('Error changing username:', error);
      Alert.alert('Error', error.message || 'Failed to change username. Please try again.');
    } finally {
      setChangingUsername(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      Alert.alert('Success', 'Password updated successfully!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePaypalEmail = async () => {
    if (!user) return;
    const trimmed = paypalEmail.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a PayPal email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setSavingPaypal(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ paypal_email: trimmed })
        .eq('id', user.id);
      if (error) throw error;
      setPaypalEmail(trimmed);
      setShowPaypalEdit(false);
      Alert.alert('Saved', 'PayPal email updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save PayPal email');
    } finally {
      setSavingPaypal(false);
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

        {/* Change Username */}
        {!showChangeUsername ? (
          <TouchableOpacity 
            style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary, opacity: canChangeUsername() ? 1 : 0.5 }]}
            onPress={() => {
              if (canChangeUsername()) {
                setShowChangeUsername(true);
              } else {
                const daysRemaining = Math.ceil(30 - (Date.now() - lastUsernameChange!.getTime()) / (1000 * 60 * 60 * 24));
                Alert.alert(
                  'Cannot Change Username',
                  `You can only change your username once every 30 days. Please try again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
                );
              }
            }}
            disabled={!canChangeUsername()}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.primary }]}>Change Username</Text>
              {!canChangeUsername() && (
                <Text style={[styles.optionDescription, { color: theme.textSecondary, marginLeft: 8 }]}>
                  (30 day cooldown)
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
            <Text style={[styles.optionText, { color: theme.textPrimary, marginBottom: 12 }]}>Change Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="Enter new username"
              placeholderTextColor={theme.textTertiary}
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.borderSecondary }]}
                onPress={() => {
                  setShowChangeUsername(false);
                  setNewUsername('');
                }}
              >
                <Text style={[styles.buttonText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleChangeUsername}
                disabled={changingUsername}
              >
                {changingUsername ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Change Password */}
        {!showChangePassword ? (
          <TouchableOpacity 
            style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
            onPress={() => setShowChangePassword(true)}
          >
            <Text style={[styles.optionText, { color: theme.primary }]}>Change Password</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
            <Text style={[styles.optionText, { color: theme.textPrimary, marginBottom: 12 }]}>Change Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary, marginBottom: 12 }]}
              placeholder="Current password"
              placeholderTextColor={theme.textTertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary, marginBottom: 12 }]}
              placeholder="New password"
              placeholderTextColor={theme.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary, marginBottom: 12 }]}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.borderSecondary }]}
                onPress={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.buttonText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* PayPal Email for Withdrawals */}
        {!showPaypalEdit ? (
          <TouchableOpacity
            style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
            onPress={() => setShowPaypalEdit(true)}
          >
            <View style={styles.optionRow}>
              <Text style={[styles.optionText, { color: theme.primary }]}>PayPal Email</Text>
              {paypalEmail ? (
                <Text style={[styles.optionDescription, { color: theme.textSecondary, marginLeft: 8, flex: 1 }]} numberOfLines={1}>
                  {paypalEmail}
                </Text>
              ) : (
                <Text style={[styles.optionDescription, { color: theme.textTertiary, marginLeft: 8 }]}>
                  Not set
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
            <Text style={[styles.optionText, { color: theme.textPrimary, marginBottom: 4 }]}>PayPal Email</Text>
            <Text style={[styles.optionDescription, { color: theme.textSecondary, marginBottom: 12 }]}>
              Used to receive withdrawals from your wallet
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
              placeholder="your@paypal-email.com"
              placeholderTextColor={theme.textTertiary}
              value={paypalEmail}
              onChangeText={setPaypalEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.borderSecondary }]}
                onPress={() => setShowPaypalEdit(false)}
              >
                <Text style={[styles.buttonText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSavePaypalEmail}
                disabled={savingPaypal}
              >
                {savingPaypal ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
          onPress={() => navigation.navigate('OnboardingAnswers' as never)}
        >
          <Text style={[styles.optionText, { color: theme.primary }]}>View Onboarding Answers</Text>
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
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 