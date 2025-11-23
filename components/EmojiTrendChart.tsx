import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../state/themeStore';
import Svg, { Line } from 'react-native-svg';

interface DataPoint {
  date: string; // "DD/MM"
  value: number; // 1-5
}

interface Props {
  title: string;
  data: DataPoint[];
  type: 'stress' | 'motivation';
}

export const EmojiTrendChart: React.FC<Props> = ({ title, data, type }) => {
  const { theme, isDark } = useTheme();

  const emojis = type === 'stress' 
    ? ['','😌','🙂','😐','😰','🤯'] // 1 (Low) to 5 (High)
    : ['','😫','😒','😐','😤','🔥']; // 1 (Low) to 5 (High)

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: type === 'stress' ? '#FEF3C7' : '#DBEAFE', 
        borderColor: '#E5E7EB' 
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Last 7 days</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {data.map((point, index) => {
          // Calculate height percentage (1-5 scale)
          // value 1 -> bottom (20%), value 5 -> top (100%)
          // We want some padding at top/bottom.
          // Let's say available height is 100px.
          // 5 -> 0px top
          // 1 -> 80px top
          
          const hasValue = point.value > 0;
          const chartHeight = 90;
          
          // Position from top: 5=0%, 1=80%
          // (5 - value) * (chartHeight / 4)
          const topPosition = hasValue ? ((5 - point.value) * (chartHeight - 20) / 4) : 0;

          return (
            <View key={index} style={styles.column}>
              <View style={{ height: chartHeight, alignItems: 'center', justifyContent: 'flex-end' }}>
                {/* Dashed Line */}
                {hasValue && (
                  <View style={{ position: 'absolute', top: topPosition + 15, bottom: 0, alignItems: 'center' }}>
                     <Svg height="100%" width="2">
                        <Line
                          x1="1"
                          y1="0"
                          x2="1"
                          y2="100%"
                          stroke={theme.textSecondary}
                          strokeWidth="2"
                          strokeDasharray="4, 4"
                        />
                      </Svg>
                  </View>
                )}

                {/* Emoji */}
                {hasValue && (
                  <Text style={[
                    styles.emoji,
                    { 
                      position: 'absolute',
                      top: topPosition,
                    }
                  ]}>
                    {emojis[point.value]}
                  </Text>
                )}
              </View>
              
              <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{point.date}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  column: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emoji: {
    fontSize: 28,
  },
  dateLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

