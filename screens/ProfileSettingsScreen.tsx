import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';

import { supabase } from '../lib/supabase';

export default function ProfileSettingsScreen({ navigation, route }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, updateProfile } = useAuthStore();

  



      
  let joinDateText = 'Joined';
  if (user?.created_at) {
    const date = new Date(user.created_at);
    const options = { year: 'numeric', month: 'long' } as const;
    joinDateText = `Joined ${date.toLocaleDateString(undefined, options)}`;
  }
  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile Settings</Text>
      </View>
      <Text style={[styles.joinDate, { color: theme.textTertiary }]}>{joinDateText}</Text>
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
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
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
}); 