import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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
}

const { width: screenWidth } = Dimensions.get('window');
const PODIUM_WIDTH = screenWidth - 48;
const PODIUM_HEIGHT = 220;

// Platform heights
const H1 = 140; // 1st place height
const H2 = 100; // 2nd place height
const H3 = 70;  // 3rd place height

// Equal width for all platforms
const W = PODIUM_WIDTH / 3;
const DEPTH = 20; // Depth of the top face

export default function Podium({ users }: PodiumProps) {
  const { theme } = useTheme();
  const [second, first, third] = users;

  // Use app theme colors (Green)
  const colors = {
    front: theme.primaryDark, // Darker green for front
    top: theme.primary,       // Lighter/Standard green for top
    text: '#FFFFFF',
  };

  return (
    <View style={styles.container}>
      <View style={styles.podiumContainer}>
        <Svg width={PODIUM_WIDTH} height={PODIUM_HEIGHT} style={styles.svg}>
          
          {/* --- LEFT PILLAR (2nd Place) --- */}
          <G>
            {/* Front Face */}
            <Path
              d={`
                M 0 ${PODIUM_HEIGHT}
                L ${W} ${PODIUM_HEIGHT}
                L ${W} ${PODIUM_HEIGHT - H2}
                L 0 ${PODIUM_HEIGHT - H2}
                Z
              `}
              fill={colors.front}
            />
            {/* Top Face (Slanted right) */}
            <Path
              d={`
                M 0 ${PODIUM_HEIGHT - H2}
                L ${W} ${PODIUM_HEIGHT - H2}
                L ${W + DEPTH} ${PODIUM_HEIGHT - H2 - DEPTH}
                L ${DEPTH} ${PODIUM_HEIGHT - H2 - DEPTH}
                Z
              `}
              fill={colors.top}
            />
            {/* Number 2 */}
            <SvgText
              x={W / 2}
              y={PODIUM_HEIGHT - H2 / 2 + 10}
              fill="white"
              fontSize="40"
              fontWeight="bold"
              textAnchor="middle"
            >
              2
            </SvgText>
          </G>

          {/* --- RIGHT PILLAR (3rd Place) --- */}
          <G>
            {/* Front Face */}
            <Path
              d={`
                M ${2 * W} ${PODIUM_HEIGHT}
                L ${3 * W} ${PODIUM_HEIGHT}
                L ${3 * W} ${PODIUM_HEIGHT - H3}
                L ${2 * W} ${PODIUM_HEIGHT - H3}
                Z
              `}
              fill={colors.front}
            />
            {/* Top Face (Slanted left) */}
            <Path
              d={`
                M ${2 * W} ${PODIUM_HEIGHT - H3}
                L ${3 * W} ${PODIUM_HEIGHT - H3}
                L ${3 * W - DEPTH} ${PODIUM_HEIGHT - H3 - DEPTH}
                L ${2 * W - DEPTH} ${PODIUM_HEIGHT - H3 - DEPTH}
                Z
              `}
              fill={colors.top}
            />
            {/* Number 3 */}
            <SvgText
              x={2.5 * W}
              y={PODIUM_HEIGHT - H3 / 2 + 10}
              fill="white"
              fontSize="40"
              fontWeight="bold"
              textAnchor="middle"
            >
              3
            </SvgText>
          </G>

          {/* --- MIDDLE PILLAR (1st Place) --- */}
          <G>
            {/* Front Face */}
            <Path
              d={`
                M ${W} ${PODIUM_HEIGHT}
                L ${2 * W} ${PODIUM_HEIGHT}
                L ${2 * W} ${PODIUM_HEIGHT - H1}
                L ${W} ${PODIUM_HEIGHT - H1}
                Z
              `}
              fill={colors.front}
              // Add a slight shadow/stroke to separate from others
              stroke="rgba(0,0,0,0.1)" 
              strokeWidth="1"
            />
            {/* Top Face (Diamond perspective) */}
            <Path
              d={`
                M ${W} ${PODIUM_HEIGHT - H1}
                L ${2 * W} ${PODIUM_HEIGHT - H1}
                L ${2 * W - DEPTH} ${PODIUM_HEIGHT - H1 - DEPTH}
                L ${W + DEPTH} ${PODIUM_HEIGHT - H1 - DEPTH}
                Z
              `}
              fill={colors.top}
            />
            {/* Number 1 */}
            <SvgText
              x={1.5 * W}
              y={PODIUM_HEIGHT - H1 / 2 + 10}
              fill="white"
              fontSize="50"
              fontWeight="bold"
              textAnchor="middle"
            >
              1
            </SvgText>
          </G>

        </Svg>

        {/* User Content Layers */}
        <View style={styles.usersContainer}>
          {/* 2nd Place */}
          <View style={[styles.userSlot, { left: 0, bottom: H2 + DEPTH + 10 }]}>
            {renderUser(second, 2, colors.top, theme)}
          </View>

          {/* 1st Place */}
          <View style={[styles.userSlot, { left: W, bottom: H1 + DEPTH + 10 }]}>
             {renderUser(first, 1, colors.top, theme)}
          </View>

          {/* 3rd Place */}
          <View style={[styles.userSlot, { left: 2 * W, bottom: H3 + DEPTH + 10 }]}>
             {renderUser(third, 3, colors.top, theme)}
          </View>
        </View>
      </View>
    </View>
  );
}

function renderUser(user: PodiumUser | null, rank: number, color: string, theme: any) {
  if (!user) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: theme.textTertiary }}>-</Text>
      </View>
    );
  }

  const isFirst = rank === 1;
  const avatarSize = isFirst ? 64 : 56;
  
  return (
    <View style={styles.userInfo}>
      <View style={[
        styles.avatarContainer, 
        { 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: isFirst ? 24 : 20,
          borderColor: color // Use green border
        }
      ]}>
        {user.avatar_url ? (
          <Image 
            source={{ uri: user.avatar_url }} 
            style={[styles.avatar, { borderRadius: isFirst ? 20 : 16 }]} 
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { borderRadius: isFirst ? 20 : 16 }]}>
            <Ionicons name="person" size={isFirst ? 32 : 24} color={theme.textSecondary} />
          </View>
        )}
      </View>
      
      <Text style={[styles.username, { color: theme.textPrimary }]} numberOfLines={1}>
        {user.username}
      </Text>
      
      <View style={[styles.pointsPill, { backgroundColor: color }]}>
        <View style={styles.coinIcon}>
          <Text style={styles.currencySymbol}>$</Text>
        </View>
        <Text style={styles.pointsText}>
          {user.points.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    height: 300,
  },
  podiumContainer: {
    width: PODIUM_WIDTH,
    height: '100%',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  usersContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
  },
  userSlot: {
    width: W,
    alignItems: 'center',
    position: 'absolute',
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  avatarContainer: {
    backgroundColor: '#FFF',
    padding: 2,
    borderWidth: 2,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  coinIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  currencySymbol: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: 'bold',
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center', 
    justifyContent: 'center',
    height: 60
  }
});
