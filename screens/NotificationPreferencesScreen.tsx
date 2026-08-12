import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { pushNotificationService } from '../lib/pushNotificationService';

const DARK = '#1f2937';
const CARD_BORDER = '#EEF0F3';

export type NotificationPrefs = {
  pushEnabled: boolean;
  challenges: boolean;
  social: boolean;
  reminders: boolean;
  habitRewards: boolean;
  productUpdates: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  pushEnabled: true,
  challenges: true,
  social: true,
  reminders: true,
  habitRewards: true,
  productUpdates: false,
};

function prefsKey(userId?: string | null) {
  return `notification_prefs:${userId || 'anon'}`;
}

export async function loadNotificationPrefs(userId?: string | null): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(prefsKey(userId));
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveNotificationPrefs(
  userId: string | null | undefined,
  prefs: NotificationPrefs
): Promise<void> {
  await AsyncStorage.setItem(prefsKey(userId), JSON.stringify(prefs));
}

type PrefRow = {
  key: keyof Omit<NotificationPrefs, 'pushEnabled'>;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const CATEGORY_ROWS: PrefRow[] = [
  {
    key: 'challenges',
    title: 'Challenges',
    subtitle: 'Starts, proofs due, and results',
    icon: 'trophy-outline',
  },
  {
    key: 'social',
    title: 'Social',
    subtitle: 'Follows, likes, comments, and DMs',
    icon: 'people-outline',
  },
  {
    key: 'reminders',
    title: 'Habit reminders',
    subtitle: 'Local reminders you set for habits',
    icon: 'alarm-outline',
  },
  {
    key: 'habitRewards',
    title: 'Habit rewards',
    subtitle: 'Streaks, EXP, and milestone wins',
    icon: 'sparkles-outline',
  },
  {
    key: 'productUpdates',
    title: 'Product updates',
    subtitle: 'Occasional news about Nutragise',
    icon: 'megaphone-outline',
  },
];

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [osPermission, setOsPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [busy, setBusy] = useState(false);

  const refreshPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setOsPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await loadNotificationPrefs(user?.id);
    setPrefs(next);
    await refreshPermission();
    setLoading(false);
  }, [user?.id, refreshPermission]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      refreshPermission();
    }, [refreshPermission])
  );

  const persist = async (next: NotificationPrefs) => {
    setPrefs(next);
    await saveNotificationPrefs(user?.id, next);
  };

  const togglePushMaster = async (enabled: boolean) => {
    if (enabled) {
      setBusy(true);
      try {
        const granted = await pushNotificationService.ensurePermissions();
        await refreshPermission();
        if (!granted) {
          Alert.alert(
            'Notifications are off',
            'Enable notifications for Nutragise in your device settings to receive alerts.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          await persist({ ...prefs, pushEnabled: false });
          return;
        }
        if (user?.id) {
          await pushNotificationService.initialize(user.id);
        }
        await persist({ ...prefs, pushEnabled: true });
      } finally {
        setBusy(false);
      }
      return;
    }
    await persist({ ...prefs, pushEnabled: false });
  };

  const toggleCategory = async (key: PrefRow['key'], value: boolean) => {
    if (!prefs.pushEnabled && value) {
      Alert.alert('Turn on push first', 'Enable push notifications above to control categories.');
      return;
    }
    await persist({ ...prefs, [key]: value });
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DARK} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 28 + bottomNavPadding }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Preferences</Text>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Choose what reaches you
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Device status:{' '}
                {osPermission === 'granted'
                  ? 'allowed'
                  : osPermission === 'denied'
                    ? 'blocked in system settings'
                    : 'not decided yet'}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Push</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconChip}>
                  <Ionicons name="notifications-outline" size={18} color={DARK} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                    Push notifications
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                    Master switch for alerts on this device
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={DARK} />
                ) : (
                  <Switch
                    value={prefs.pushEnabled && osPermission === 'granted'}
                    onValueChange={togglePushMaster}
                    trackColor={{ false: '#E5E7EB', true: DARK }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E7EB"
                  />
                )}
              </View>
              {osPermission === 'denied' && (
                <TouchableOpacity
                  style={styles.settingsLink}
                  onPress={() => Linking.openSettings()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.settingsLinkText}>Open {Platform.OS === 'ios' ? 'iOS' : 'device'} Settings</Text>
                  <Ionicons name="open-outline" size={16} color={DARK} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Categories</Text>
            <View style={styles.card}>
              {CATEGORY_ROWS.map((row, index) => (
                <View key={row.key}>
                  <View style={styles.row}>
                    <View style={styles.iconChip}>
                      <Ionicons name={row.icon} size={18} color={DARK} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{row.title}</Text>
                      <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                        {row.subtitle}
                      </Text>
                    </View>
                    <Switch
                      value={prefs.pushEnabled && prefs[row.key]}
                      onValueChange={(v) => toggleCategory(row.key, v)}
                      trackColor={{ false: '#E5E7EB', true: DARK }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E5E7EB"
                      disabled={!prefs.pushEnabled || osPermission !== 'granted'}
                    />
                  </View>
                  {index < CATEGORY_ROWS.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>

            <Text style={[styles.footnote, { color: theme.textSecondary }]}>
              Habit reminders still need notification permission. Category preferences are saved on
              this device and applied when new alerts are sent.
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  backButton: { padding: 8, width: 40 },
  headerSpacer: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 20,
    marginBottom: 20,
  },
  heroEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', lineHeight: 28, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, lineHeight: 16 },
  divider: { height: 1, backgroundColor: CARD_BORDER, marginLeft: 62 },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  settingsLinkText: { color: DARK, fontSize: 14, fontWeight: '700' },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
