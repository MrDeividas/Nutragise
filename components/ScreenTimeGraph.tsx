import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

interface ScreenTimeGraphProps {
  title?: string;
  data?: number[]; // Array of hours for each day (7 days)
  targetHours?: number;
  halfWidth?: boolean;
}

export default function ScreenTimeGraph({ 
  title = 'Screen Time',
  data = [4.5, 6.2, 3.8, 5.1, 7.3, 4.9, 5.6], // Default mock data (7 days in hours)
  targetHours = 5,
  halfWidth = false
}: ScreenTimeGraphProps) {
  const { theme } = useTheme();
  
  // Calculate max hours for scaling
  const maxHours = Math.max(...data, targetHours + 2);
  const minHours = 0;
  
  // Calculate current average
  const currentAverage = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // Get latest value (today/yesterday)
  const latestValue = data[data.length - 1];
  
  // Calculate trend: compare latest value vs average
  let trendColor = '#22C55E';
  let trendIcon = 'trending-down';
  if (data.length >= 1) {
    const isAboveAverage = latestValue > currentAverage;
    trendColor = isAboveAverage ? '#EF4444' : '#22C55E'; // Red if above average (bad), Green if below average (good)
    trendIcon = isAboveAverage ? 'trending-up' : 'trending-down';
  }
  
  // Get position for target line (percentage from bottom)
  const targetPosition = ((targetHours - minHours) / (maxHours - minHours)) * 100;
  
  // Get position for each data point
  const getBarHeight = (hours: number) => {
    return ((hours - minHours) / (maxHours - minHours)) * 100;
  };
  
  return (
    <View style={[
      styles.container, 
      halfWidth && styles.halfWidth,
      { 
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB' 
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text>
        </View>
      </View>
      
      {/* Current Value */}
      <View style={styles.currentValueContainer}>
        <View style={styles.valueRow}>
          <Text style={[styles.currentValue, { color: theme.textPrimary }]}>
            {latestValue.toFixed(1)}
            <Text style={[styles.unit, { color: theme.textSecondary }]}>h</Text>
          </Text>
          {data.length >= 1 && (
            <Ionicons name={trendIcon as any} size={24} color={trendColor} style={styles.trendIcon} />
          )}
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Yesterday
        </Text>
      </View>
      
      {/* Graph */}
      <View style={styles.graphContainer}>
        {/* Target line */}
        <View 
          style={[
            styles.targetLine,
            { 
              bottom: `${targetPosition}%`,
              borderColor: 'rgba(128, 128, 128, 0.3)'
            }
          ]}
        />
        
        {/* Target label */}
        <View 
          style={[
            styles.targetLabel,
            { 
              bottom: `${targetPosition}%`,
              backgroundColor: theme.cardBackground,
            }
          ]}
        >
          <Text style={[styles.targetLabelText, { color: theme.textSecondary }]}>
            {targetHours}h
          </Text>
        </View>
        
        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((hours, index) => {
            const height = getBarHeight(hours);
            const isOverTarget = hours > targetHours;
            const isUnderTarget = hours < targetHours;
            
            return (
              <View key={index} style={styles.barColumn}>
                {/* Bar */}
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: isOverTarget 
                          ? 'rgba(239, 68, 68, 0.3)' 
                          : isUnderTarget
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(128, 128, 128, 0.3)'
                      }
                    ]}
                  >
                    {/* Dot at top */}
                    <View 
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isOverTarget 
                            ? '#EF4444' 
                            : isUnderTarget
                              ? '#22C55E'
                              : 'rgba(128, 128, 128, 0.6)'
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      
      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Avg {currentAverage.toFixed(1)}h/day • Target {targetHours}h/day
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 0,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  halfWidth: {
    flex: 1,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  currentValueContainer: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  trendIcon: {
    marginLeft: 4,
  },
  unit: {
    fontSize: 18,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  graphContainer: {
    height: 110,
    position: 'relative',
    marginBottom: 12,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  targetLabel: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  targetLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 4,
    borderRadius: 2,
    position: 'relative',
    minHeight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: -4,
    left: -2,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

