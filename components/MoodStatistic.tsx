import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../state/themeStore';
import Svg, { Circle, Text as SvgText, Rect } from 'react-native-svg';

interface MoodData {
  happy: number;  // percentage
  sad: number;    // percentage
  angry: number;  // percentage
  dominantMood: string; // 'happy' | 'sad' | 'angry'
  dominantDays: number; // count of days in dominant mood
}

interface MoodStatisticProps {
  data?: MoodData;
  halfWidth?: boolean;
}

export default function MoodStatistic({ 
  data = {
    happy: 65,
    sad: 22,
    angry: 13,
    dominantMood: 'happy',
    dominantDays: 5
  },
  halfWidth = false
}: MoodStatisticProps) {
  const { theme } = useTheme();
  
  // Circle properties
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Gap between segments (in percentage)
  const gapPercentage = 5;
  const totalGaps = 3; // Three gaps for three segments
  const totalGapPercentage = gapPercentage * totalGaps;
  
  // Colors for each mood
  const happyColor = '#7DD3FC'; // Light blue
  const sadColor = '#F9A8D4'; // Light pink
  const angryColor = '#FDE68A'; // Light yellow
  
  // Create array of segments with their data
  const segments = [
    { name: 'happy', percentage: data.happy, color: happyColor },
    { name: 'sad', percentage: data.sad, color: sadColor },
    { name: 'angry', percentage: data.angry, color: angryColor }
  ];
  
  // Sort by percentage descending (largest first)
  segments.sort((a, b) => b.percentage - a.percentage);
  
  // Adjust segment sizes to account for gaps
  const adjustedSegments = segments.map(seg => ({
    ...seg,
    adjusted: (seg.percentage * (100 - totalGapPercentage)) / 100
  }));
  
  // Position the largest segment at the bottom (centered at 90 degrees)
  // Start from bottom-left and go clockwise
  const largestSegment = adjustedSegments[0];
  const secondSegment = adjustedSegments[1];
  const thirdSegment = adjustedSegments[2];
  
  // Calculate starting angle so largest segment is centered at bottom (90 degrees)
  const largestStartAngle = 90 - (largestSegment.adjusted / 100) * 360 / 2;
  
  // Calculate positions for percentage labels (on top of the ring)
  const center = size / 2;
  const labelRadius = radius + strokeWidth / 4;
  
  // Build segment rendering data with label positions
  const segmentData = [
    {
      ...largestSegment,
      startAngle: largestStartAngle,
      offset: circumference * (1 - largestSegment.adjusted / 100)
    },
    {
      ...secondSegment,
      startAngle: largestStartAngle + (largestSegment.adjusted / 100) * 360 + gapPercentage * 3.6,
      offset: circumference * (1 - secondSegment.adjusted / 100)
    },
    {
      ...thirdSegment,
      startAngle: largestStartAngle + (largestSegment.adjusted / 100) * 360 + gapPercentage * 3.6 + (secondSegment.adjusted / 100) * 360 + gapPercentage * 3.6,
      offset: circumference * (1 - thirdSegment.adjusted / 100)
    }
  ].map(seg => {
    const midAngle = seg.startAngle + (seg.adjusted / 100) * 360 / 2;
    const midRad = (midAngle * Math.PI) / 180;
    return {
      ...seg,
      labelX: center + labelRadius * Math.cos(midRad),
      labelY: center + labelRadius * Math.sin(midRad)
    };
  });
  
  // Label box dimensions
  const labelBoxWidth = 36;
  const labelBoxHeight = 19;
  
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Mood Statistic
        </Text>
      </View>
      
      {/* Circular Chart */}
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Render segments dynamically */}
          {segmentData.map((seg, index) => (
            <Circle
              key={seg.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={seg.offset}
              strokeLinecap="round"
              rotation={seg.startAngle}
              origin={`${size / 2}, ${size / 2}`}
            />
          ))}
          
          {/* Percentage labels on segments with background boxes */}
          {segmentData.map((seg) => (
            seg.percentage > 0 && (
              <React.Fragment key={`${seg.name}-label`}>
                <Rect
                  x={seg.labelX - labelBoxWidth / 2}
                  y={seg.labelY - labelBoxHeight / 2}
                  width={labelBoxWidth}
                  height={labelBoxHeight}
                  fill="rgba(209, 213, 219, 0.5)"
                  rx="4"
                  ry="4"
                />
                <SvgText
                  x={seg.labelX - 5}
                  y={seg.labelY}
                  fill="#1F2937"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  letterSpacing="0"
                >
                  {seg.percentage}%
                </SvgText>
              </React.Fragment>
            )
          ))}
        </Svg>
        
        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={[styles.centerNumber, { color: theme.textPrimary }]}>
            {data.dominantDays}
          </Text>
          <Text style={[styles.centerLabel, { color: theme.textSecondary }]}>
            {data.dominantMood.charAt(0).toUpperCase() + data.dominantMood.slice(1)} Days
          </Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: happyColor }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Happy
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: sadColor }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Sad
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: angryColor }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Angry
          </Text>
        </View>
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
  emoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 4,
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  centerLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
});

