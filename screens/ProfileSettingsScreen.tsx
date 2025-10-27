import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';

import { supabase } from '../lib/supabase';

export default function ProfileSettingsScreen({ navigation, route }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, signOut } = useAuthStore();

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
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
        <TouchableOpacity 
          style={[styles.option, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]} 
          onPress={toggleTheme}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionLeft}>
              <Ionicons 
                name={isDark ? "sunny" : "moon"} 
                size={20} 
                color={theme.primary} 
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: theme.primary }]}>
                {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

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


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 34,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
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
}); 