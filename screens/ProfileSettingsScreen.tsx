import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

import { supabase } from '../lib/supabase';
import { iapService } from '../lib/iapService';
import { adminService } from '../lib/adminService';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const accent = theme.textPrimary;
  const softAccent = `${theme.textPrimary}14`;
  const cardBg = '#FFFFFF';
  const cardBorder = '#EEF0F3';

  const checkEmailStatus = async () => {
    const verified = await checkEmailVerification();
    setEmailVerified(verified);
  };

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

  const checkAdminStatus = async () => {
    if (!user?.id) return;
    try {
      const admin = await adminService.isAdmin(user.id);
      setIsAdmin(admin);
      if (__DEV__) {
        console.log('Admin status check:', { userId: user.id, isAdmin: admin });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

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
        "Please check your inbox for the verification email. If you don't see it, check your spam folder."
      );
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      if (user?.id) await iapService.logIn(user.id);
      const url = await iapService.getManagementUrl();
      if (!url) {
        Alert.alert('Subscription', 'Manage your subscription from the device store settings.');
        return;
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open subscription management page');
      }
    } catch (error: any) {
      console.error('Error opening subscription management:', error);
      Alert.alert('Error', error?.message || 'Failed to open subscription management.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      if (user?.id) await iapService.logIn(user.id);
      const result = await iapService.restorePurchases();

      if (result.status === 'error') {
        Alert.alert('Restore Failed', result.message);
        return;
      }

      if (result.status === 'success' && iapService.hasProEntitlement(result.customerInfo)) {
        Alert.alert('Pro Restored', 'Your Pro subscription has been restored.');
        loadUserProfile();
      } else {
        Alert.alert('No Purchases Found', 'We could not find an active Pro subscription on this account.');
      }
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases.');
    }
  };

  const canChangeUsername = (): boolean => {
    if (!lastUsernameChange) return true;
    const daysSinceChange = (Date.now() - lastUsernameChange.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 30;
  };

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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: newUsername.trim(),
          username_last_changed: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      try {
        await supabase.from('users').update({ username: newUsername.trim() }).eq('id', user.id);
      } catch (usersError) {
        console.warn('Failed to update users table:', usersError);
      }

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
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

  const closeDeleteModal = () => {
    if (deletingAccount) return;
    setShowDeleteModal(false);
    setDeletePassword('');
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address found for this account.');
      return;
    }
    if (!deletePassword.trim()) {
      Alert.alert('Password required', 'Please enter your password to confirm account deletion.');
      return;
    }

    setDeletingAccount(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (authError) {
        Alert.alert('Incorrect password', 'The password you entered is incorrect. Please try again.');
        return;
      }

      const { error } = await supabase.rpc('delete_user');
      if (error) {
        Alert.alert('Error', 'Failed to delete account. Please contact support.');
        return;
      }

      setShowDeleteModal(false);
      setDeletePassword('');
      await signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const renderRow = ({
    icon,
    label,
    onPress,
    value,
    disabled,
    destructive,
    showChevron = true,
  }: {
    icon: IoniconName;
    label: string;
    onPress?: () => void;
    value?: string;
    disabled?: boolean;
    destructive?: boolean;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, disabled && { opacity: 0.45 }]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: softAccent }]}>
        <Ionicons name={icon} size={18} color={destructive ? '#DC2626' : accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: destructive ? '#DC2626' : accent }]}>{label}</Text>
        {!!value && (
          <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />}
    </TouchableOpacity>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>{children}</View>
    </View>
  );

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + bottomNavPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {emailVerified === false && (
            <View style={styles.verifyBanner}>
              <View style={styles.verifyTop}>
                <View style={styles.verifyIconWrap}>
                  <Ionicons name="mail-unread-outline" size={20} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifyTitle}>Verify your email</Text>
                  <Text style={[styles.verifySubtitle, { color: theme.textSecondary }]}>
                    Confirm your email to keep your account secure
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleResendVerification}
                disabled={resendingEmail}
                activeOpacity={0.8}
              >
                {resendingEmail ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>Resend email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Section title="Account">
            {!showChangeUsername ? (
              renderRow({
                icon: 'person-outline',
                label: 'Change Username',
                value: canChangeUsername() ? undefined : '30 day cooldown',
                disabled: !canChangeUsername(),
                onPress: () => {
                  if (canChangeUsername()) {
                    setShowChangeUsername(true);
                  } else {
                    const daysRemaining = Math.ceil(
                      30 - (Date.now() - lastUsernameChange!.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    Alert.alert(
                      'Cannot Change Username',
                      `You can only change your username once every 30 days. Please try again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
                    );
                  }
                },
              })
            ) : (
              <View style={styles.expandBlock}>
                <Text style={[styles.expandTitle, { color: accent }]}>Change Username</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder }]}
                  placeholder="Enter new username"
                  placeholderTextColor={theme.textTertiary}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: cardBorder }]}
                    onPress={() => {
                      setShowChangeUsername(false);
                      setNewUsername('');
                    }}
                  >
                    <Text style={[styles.secondaryButtonText, { color: accent }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: accent }]}
                    onPress={handleChangeUsername}
                    disabled={changingUsername}
                  >
                    {changingUsername ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: cardBorder }]} />

            {!showChangePassword ? (
              renderRow({
                icon: 'lock-closed-outline',
                label: 'Change Password',
                onPress: () => setShowChangePassword(true),
              })
            ) : (
              <View style={styles.expandBlock}>
                <Text style={[styles.expandTitle, { color: accent }]}>Change Password</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder, marginBottom: 10 }]}
                  placeholder="Current password"
                  placeholderTextColor={theme.textTertiary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder, marginBottom: 10 }]}
                  placeholder="New password"
                  placeholderTextColor={theme.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: cardBorder }]}
                    onPress={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={[styles.secondaryButtonText, { color: accent }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: accent }]}
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: cardBorder }]} />

            {!showPaypalEdit ? (
              renderRow({
                icon: 'logo-paypal',
                label: 'PayPal Email',
                value: paypalEmail || 'Not set',
                onPress: () => setShowPaypalEdit(true),
              })
            ) : (
              <View style={styles.expandBlock}>
                <Text style={[styles.expandTitle, { color: accent }]}>PayPal Email</Text>
                <Text style={[styles.expandHint, { color: theme.textSecondary }]}>
                  Used to receive withdrawals from your wallet
                </Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder }]}
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
                    style={[styles.secondaryButton, { borderColor: cardBorder }]}
                    onPress={() => setShowPaypalEdit(false)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: accent }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: accent }]}
                    onPress={handleSavePaypalEmail}
                    disabled={savingPaypal}
                  >
                    {savingPaypal ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Section>

          <Section title="Preferences">
            {renderRow({
              icon: 'clipboard-outline',
              label: 'View Onboarding Answers',
              onPress: () => navigation.navigate('OnboardingAnswers' as never),
            })}
            <View style={[styles.divider, { backgroundColor: cardBorder }]} />
            {renderRow({
              icon: 'images-outline',
              label: 'Change Profile Card',
              onPress: () => navigation.navigate('ProfileCard' as never),
            })}
            <View style={[styles.divider, { backgroundColor: cardBorder }]} />
            {renderRow({
              icon: 'notifications-outline',
              label: 'Notification Preferences',
              onPress: () => {},
            })}
          </Section>

          <Section title="Subscription">
            {userProfile?.is_pro && (
              <>
                {renderRow({
                  icon: 'card-outline',
                  label: 'Manage Subscription',
                  onPress: handleManageSubscription,
                })}
                <View style={[styles.divider, { backgroundColor: cardBorder }]} />
              </>
            )}
            {renderRow({
              icon: 'refresh-outline',
              label: 'Restore Purchases',
              onPress: handleRestorePurchases,
            })}
          </Section>

          <Section title="Legal">
            {renderRow({
              icon: 'document-text-outline',
              label: 'Privacy Policy',
              onPress: () => Linking.openURL('https://www.nutragise.com/privacy-policy'),
            })}
            <View style={[styles.divider, { backgroundColor: cardBorder }]} />
            {renderRow({
              icon: 'reader-outline',
              label: 'Terms of Service',
              onPress: () => Linking.openURL('https://www.nutragise.com/terms'),
            })}
          </Section>

          {isAdmin && (
            <Section title="Admin">
              {renderRow({
                icon: 'shield-checkmark-outline',
                label: 'Admin Review',
                onPress: () => navigation.navigate('AdminReview' as never),
              })}
            </Section>
          )}

          <Section title="Account actions">
            {renderRow({
              icon: 'trash-outline',
              label: 'Delete Account',
              destructive: true,
              onPress: () => setShowDeleteModal(true),
            })}
            <View style={[styles.divider, { backgroundColor: cardBorder }]} />
            {renderRow({
              icon: 'log-out-outline',
              label: 'Log Out',
              destructive: true,
              onPress: handleSignOut,
            })}
          </Section>
        </ScrollView>

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDeleteModal} />
            <View style={[styles.deleteModalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.deleteModalIconWrap}>
                <Ionicons name="warning-outline" size={28} color="#DC2626" />
              </View>
              <Text style={[styles.deleteModalTitle, { color: accent }]}>Delete account</Text>
              <Text style={[styles.deleteModalBody, { color: theme.textSecondary }]}>
                This cannot be undone. All your data will be permanently erased. Enter your password to confirm.
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: cardBorder }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textTertiary}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!deletingAccount}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: cardBorder }]}
                  onPress={closeDeleteModal}
                  disabled={deletingAccount}
                >
                  <Text style={[styles.secondaryButtonText, { color: accent }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    styles.deleteConfirmButton,
                    { opacity: deletingAccount || !deletePassword.trim() ? 0.5 : 1 },
                  ]}
                  onPress={handleConfirmDeleteAccount}
                  disabled={deletingAccount || !deletePassword.trim()}
                >
                  {deletingAccount ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  expandBlock: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  expandTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  expandHint: {
    fontSize: 13,
    marginBottom: 10,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 15,
    backgroundColor: '#F8F9FB',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifyBanner: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F5D08A',
    backgroundColor: '#FFF8EB',
    marginBottom: 22,
    gap: 12,
  },
  verifyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  verifySubtitle: {
    fontSize: 13,
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    minHeight: 42,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteModalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    zIndex: 1,
  },
  deleteModalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteModalBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  deleteConfirmButton: {
    backgroundColor: '#DC2626',
  },
});
