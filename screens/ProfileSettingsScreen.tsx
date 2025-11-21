import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';

import { supabase } from '../lib/supabase';

export default function ProfileSettingsScreen() {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, signOut, resendVerificationEmail, checkEmailVerification } = useAuthStore();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Check email verification status
  const checkEmailStatus = async () => {
    const verified = await checkEmailVerification();
    setEmailVerified(verified);
  };

  // Check on mount and when screen comes into focus
  useEffect(() => {
    checkEmailStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkEmailStatus();
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
      <ScrollView contentContainerStyle={styles.optionsContainer}>
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
}); 