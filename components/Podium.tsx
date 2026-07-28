import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../state/themeStore';

interface PodiumUser {
  id: string;
  username: string;
  points: number;
  rank: number;
  avatar_url?: string;
}

interface PodiumProps {
  users: [PodiumUser | null, PodiumUser | null, PodiumUser | null]; // [2nd, 1st, 3rd]
  currentUserId?: string | null;
}

const MEDAL_COLOR = {
  1: '#F5C518',
  2: '#C0C5CE',
  3: '#CD7F32',
} as const;

const PODIUM_HEIGHT = {
  1: 120,
  2: 88,
  3: 64,
} as const;

function getInitials(username: string) {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase() || '?';
}

export default function Podium({ users, currentUserId }: PodiumProps) {
  const { theme } = useTheme();
  const [second, first, third] = users;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PodiumSlot
          user={second}
          rank={2}
          theme={theme}
          isCurrentUser={!!second && second.id === currentUserId}
        />
        <PodiumSlot
          user={first}
          rank={1}
          theme={theme}
          isCurrentUser={!!first && first.id === currentUserId}
        />
        <PodiumSlot
          user={third}
          rank={3}
          theme={theme}
          isCurrentUser={!!third && third.id === currentUserId}
        />
      </View>
    </View>
  );
}

function PodiumSlot({
  user,
  rank,
  theme,
  isCurrentUser,
}: {
  user: PodiumUser | null;
  rank: 1 | 2 | 3;
  theme: any;
  isCurrentUser: boolean;
}) {
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 56 : 48;
  const podiumHeight = PODIUM_HEIGHT[rank];
  const medalColor = MEDAL_COLOR[rank];

  return (
    <View style={styles.slot}>
      <View style={styles.userBlock}>
        {user ? (
          <>
            <View
              style={[
                styles.avatarWrap,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderColor: isCurrentUser ? theme.primary : '#E5E7EB',
                },
              ]}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={[styles.avatarInitials, { fontSize: isFirst ? 18 : 15 }]}>
                    {getInitials(user.username)}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.username,
                { color: isCurrentUser ? theme.primary : theme.textPrimary },
              ]}
              numberOfLines={1}
            >
              {isCurrentUser ? 'YOU' : user.username.toUpperCase()}
            </Text>

            <Text style={[styles.points, { color: rank === 1 ? theme.primary : '#1f2937' }]}>
              {user.points.toLocaleString()}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.emptyAvatar, { width: avatarSize, height: avatarSize }]}>
              <Text style={{ color: theme.textTertiary }}>—</Text>
            </View>
            <Text style={[styles.username, { color: theme.textTertiary }]}>—</Text>
            <Text style={[styles.points, { color: theme.textTertiary }]}>—</Text>
          </>
        )}
      </View>

      <View style={[styles.podiumBar, { height: podiumHeight }]}>
        <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
          <Text style={styles.medalNumber}>{rank}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  userBlock: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    minHeight: 110,
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyAvatar: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  username: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
    maxWidth: '100%',
    letterSpacing: 0.2,
  },
  points: {
    fontSize: 22,
    fontWeight: '800',
  },
  podiumBar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medalBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  medalNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
