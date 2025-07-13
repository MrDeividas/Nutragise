import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockNotifications = [
  { id: '1', name: 'Micheal Drek', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: 'just now' },
  { id: '2', name: 'Jessyka Swan', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: 'just now' },
  { id: '3', name: 'Bruno Mars', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: '2 hours' },
  { id: '4', name: 'Chsitopher J.', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: '7 hours' },
  { id: '5', name: 'Jin Yang', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: '2 days' },
  { id: '6', name: 'Anis Mosal', avatar: require('../assets/icon.png'), message: 'Kudos your activity!', time: '3 days' },
];

export default function NotificationsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<'kudos' | 'comments'>('kudos');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={{ marginLeft: 16 }}>
          <View style={styles.bellContainer}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
            <View style={styles.badge}><Text style={styles.badgeText}>5</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'kudos' && styles.tabActive]}
          onPress={() => setSelectedTab('kudos')}
        >
          <Ionicons name="heart-outline" size={16} color={selectedTab === 'kudos' ? '#129490' : '#6b7280'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, selectedTab === 'kudos' && styles.tabTextActive]}>Kudos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'comments' && styles.tabActive]}
          onPress={() => setSelectedTab('comments')}
        >
          <Text style={[styles.tabText, selectedTab === 'comments' && styles.tabTextActive]}>Comments</Text>
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>
      {/* Notification List */}
      <FlatList
        data={mockNotifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={item.avatar} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20, // match ProfileScreen
    fontWeight: '600', // match ProfileScreen
    color: '#1f2937',
    textAlign: 'left',
  },
  headerIcons: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellContainer: {
    position: 'relative',
    marginLeft: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff5a5f',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    margin: 16,
    padding: 4,
    alignSelf: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#129490',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff5a5f',
    marginLeft: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  time: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 12,
    minWidth: 60,
    textAlign: 'right',
  },
}); 