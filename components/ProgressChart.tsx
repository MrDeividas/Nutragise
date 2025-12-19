import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { useAuthStore } from '../state/authStore';
import { DailyHabits } from '../types/database';
import Svg, { Line, Circle, Path, G, Defs, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';

interface Props {
  onClose: () => void;
}

export default function ProgressChart({ onClose }: Props) {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const [sleepData, setSleepData] = useState<Array<{ date: string; quality: number; hours: number; waterIntake: number; mood: number; motivation: number; stress: number; distance: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.15)';
  
  // Chart dimensions
  const chartWidth = 340; // Fixed width for modal
  const chartHeight = 300; // Increased from 200 to use more vertical space
  
  // Helper function to calculate X position for data points
  const getXPosition = (index: number) => {
    const chartAreaWidth = (chartWidth - 60);
    const segmentWidth = chartAreaWidth / sleepData.length;
    return segmentWidth * index + segmentWidth / 2; // Center each point in its segment
  };

  // Helper function to convert percentage (0-100) to 1-4 scale
  const convertSleepQualityToScale = (percentage: number) => {
    if (percentage <= 25) return 1; // Poor
    if (percentage <= 50) return 2; // Fair
    if (percentage <= 75) return 3; // Good
    return 4; // Excellent
  };

  // Helper function to generate quality line path
  const generateQualityLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => {
        if (day.quality >= 0) {
          const scaledQuality = convertSleepQualityToScale(day.quality);
          return {
            x: getXPosition(index),
                         y: chartHeight - (scaledQuality * 60), // 1-4 scale with 40px spacing for 0-4 axis
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to generate hours line path
  const generateHoursLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => ({
        x: getXPosition(index),
        y: chartHeight - (day.hours * 25),
        hasData: day.hours >= 0
      }))
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to generate water intake line path
  const generateWaterIntakeLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => {
        if (day.waterIntake >= 0) {
          return {
            x: getXPosition(index),
            y: chartHeight - (day.waterIntake * 66.66),
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to generate mood line path
  const generateMoodLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => {
        if (day.mood >= 0) {
          return {
            x: getXPosition(index),
            y: chartHeight - (day.mood * 60), // 1-5 scale with 40px spacing
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to generate motivation line path
  const generateMotivationLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => {
        if (day.motivation >= 0) {
          return {
            x: getXPosition(index),
            y: chartHeight - (day.motivation * 60), // 1-5 scale with 40px spacing
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to generate stress line path
  const generateStressLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => {
        if (day.stress >= 0) {
          return {
            x: getXPosition(index),
            y: chartHeight - (day.stress * 60), // 1-5 scale with 40px spacing
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Helper function to get distance chart configuration
  const getDistanceChartConfig = () => {
    const maxDistance = Math.max(...sleepData.map(day => day.distance).filter(d => d >= 0));
    
    if (maxDistance <= 10) {
      return { max: 10, increment: 2, gridLines: [0, 2, 4, 6, 8, 10], pixelsPerKm: 20 };
    } else if (maxDistance <= 20) {
      return { max: 20, increment: 4, gridLines: [0, 4, 8, 12, 16, 20], pixelsPerKm: 10 };
    } else if (maxDistance <= 50) {
      return { max: 50, increment: 10, gridLines: [0, 10, 20, 30, 40, 50], pixelsPerKm: 4 };
    } else {
      const max = Math.ceil(maxDistance / 10) * 10;
      const increment = max / 5;
      const gridLines = Array.from({length: 6}, (_, i) => i * increment);
      return { max, increment, gridLines, pixelsPerKm: 200 / max };
    }
  };

  // Helper function to generate distance line path
  const generateDistanceLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const config = getDistanceChartConfig();
    const validPoints = sleepData
      .map((day, index) => {
        if (day.distance >= 0) {
          return {
            x: getXPosition(index),
            y: chartHeight - (day.distance * config.pixelsPerKm), // Dynamic scaling based on chart config
            hasData: true
          };
        }
        return { x: 0, y: 0, hasData: false };
      })
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  useEffect(() => {
    if (user) {
      loadSleepData();
    }
  }, [user, selectedPeriod]);

  const loadSleepData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date();
      const daysToShow = selectedPeriod === 'week' ? 7 : 30;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToShow + 1);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      const habits = await dailyHabitsService.getDailyHabitsRange(user.id, startDateStr, endDateStr);
      
      const sleep: Array<{ date: string; quality: number; hours: number; waterIntake: number; mood: number; motivation: number; stress: number; distance: number }> = [];
      
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayHabits = habits.find(h => h.date === dateStr);
        
        // Always add a data point, populate with available data
        sleep.push({
          date: dateStr,
          quality: dayHabits?.sleep_quality ?? -1,
          hours: dayHabits?.sleep_hours ?? -1,
          waterIntake: dayHabits?.water_intake ?? -1,
          mood: dayHabits?.reflect_mood ?? -1,
          motivation: dayHabits?.reflect_motivation ?? -1,
          stress: dayHabits?.reflect_stress ?? -1,
          distance: dayHabits?.run_distance ?? -1
        });
      }
      
      setSleepData(sleep);
      
      // Log distance chart configuration for debugging
      const maxDistance = Math.max(...sleep.map(day => day.distance).filter(d => d >= 0));
    } catch (error) {
      console.error('Error loading sleep data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getCompletionEmoji = (percentage: number) => {
    if (percentage === 100) return '🎯';
    if (percentage >= 80) return '🔥';
    if (percentage >= 60) return '👍';
    if (percentage >= 40) return '😐';
    if (percentage >= 20) return '😕';
    return '😴';
  };

  const modalBackground = theme.background;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: modalBackground }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Progress Chart</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={48} color={theme.textSecondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: modalBackground,
        borderRadius: 0,
        borderWidth: 0,
      },
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Progress Charts</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      


      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'week' && { backgroundColor: theme.backgroundSecondary }
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === 'week' ? theme.textPrimary : theme.textSecondary }
          ]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'month' && { backgroundColor: theme.backgroundSecondary }
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === 'month' ? theme.textPrimary : theme.textSecondary }
          ]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.chartsWrapper}>
          {/* Distance Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Distance Covered
            </Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {(() => {
                  const config = getDistanceChartConfig();
                  return config.gridLines.slice().reverse().map((value, index) => {
                    const yPosition = (value / config.max) * chartHeight; // Position based on actual value
                    return (
                      <Text 
                        key={value} 
                        style={[
                          styles.yAxisText, 
                          { 
                            color: theme.textSecondary,
                            position: 'absolute',
                            top: chartHeight - yPosition - 6, // Center text on the line
                            right: 12, // Increased margin for longer labels like "40km", "50km"
                            fontSize: 11, // Even smaller font to prevent wrapping
                            lineHeight: 13, // Tighter line height
                            textAlign: 'right', // Right align for consistent positioning
                            width: 45, // Increased width for longer labels like "50km"
                            flexShrink: 0, // Prevent shrinking
                            fontWeight: '500' // Slightly bolder for better readability
                          }
                        ]}
                        numberOfLines={1} // Force single line
                      >
                        {value}km
                      </Text>
                    );
                  });
                })()}
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {(() => {
                    const config = getDistanceChartConfig();
                    return config.gridLines.map((value) => (
                      <Line
                        key={value}
                        x1={0}
                        y1={chartHeight - (value * config.pixelsPerKm)}
                        x2={chartWidth - 60}
                        y2={chartHeight - (value * config.pixelsPerKm)}
                        stroke={gridLineColor}
                        strokeWidth={1}
                      />
                    ));
                  })()}
                  
                  {/* Distance line */}
                  <Path
                    d={generateDistanceLinePath()}
                    stroke="#DC2626"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Distance data points */}
                  {(() => {
                    const config = getDistanceChartConfig();
                    return sleepData.map((day, index) => {
                      if (day.distance >= 0) {
                        const x = getXPosition(index);
                        const y = chartHeight - (day.distance * config.pixelsPerKm);
                        return (
                          <Circle
                            key={`distance-${day.date}`}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#DC2626"
                          />
                        );
                      }
                      return null;
                    });
                  })()}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      // For monthly view, only show tick marks
                      <View style={{ width: 2, height: 4, backgroundColor: theme.textSecondary, opacity: 0.3 }} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Sleep Hours Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Sleep Hours</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
                        {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {[12, 10, 8, 6, 4, 2, 0].map((value, index) => {
              const yPosition = index * 33.33; // Align with grid lines: 0, 33.33, 66.67, 100, 133.33, 166.67, 200
              return (
                <Text 
                  key={value} 
                  style={[
                    styles.yAxisText, 
                    { 
                      color: theme.textSecondary,
                      position: 'absolute',
                      top: yPosition - 6, // Center text on the line (-6 for half text height)
                      right: 8
                    }
                  ]}
                >
                  {value}
                </Text>
              );
            })}
          </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {[0, 2, 4, 6, 8, 10, 12].map((value) => (
                    <Line
                      key={value}
                      x1={0}
                      y1={chartHeight - (value * 25)}
                      x2={chartWidth - 60}
                      y2={chartHeight - (value * 25)}
                      stroke={gridLineColor}
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Sleep hours line */}
                  <Path
                    d={generateHoursLinePath()}
                    stroke="#10B981"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Data points */}
                  {sleepData.map((day, index) => {
                    if (day.hours >= 0) {
                      const x = getXPosition(index);
                      const y = chartHeight - (day.hours * 25);
                      return (
                        <Circle
                          key={day.date}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10B981"
                        />
                      );
                    }
                    return null;
                  })}
                </Svg>
              </View>
              
            </View>
            
            {/* Vertical Y-axis label on left */}
            <View style={styles.verticalYAxisLabel}>
              <Text style={[styles.verticalYAxisText, { color: theme.textSecondary }]}>Hours</Text>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Sleep Quality Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Sleep Quality</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
                        {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {['Excel', 'Good', 'Fair', 'Poor'].map((label, index) => {
              const yPosition = (index + 1) * 40; // All labels moved down one line: 40, 80, 120, 160
              return (
                <Text 
                  key={label} 
                  style={[
                    styles.yAxisText, 
                    { 
                      color: theme.textSecondary,
                      position: 'absolute',
                      top: yPosition - 6, // Center text on the line (-6 for half text height)
                      right: 8
                    }
                  ]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                                {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map((value) => (
                <Line
                  key={value}
                  x1={0}
                  y1={chartHeight - (value * 60)}
                  x2={chartWidth - 60}
                  y2={chartHeight - (value * 60)}
                  stroke={gridLineColor}
                  strokeWidth={1}
                />
              ))}
                  
                  {/* Sleep quality line */}
                  <Path
                    d={generateQualityLinePath()}
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                                {/* Data points */}
              {sleepData.map((day, index) => {
                if (day.quality >= 0) {
                  const x = getXPosition(index);
                  const scaledQuality = convertSleepQualityToScale(day.quality);
                  const y = chartHeight - (scaledQuality * 60);
                  return (
                    <Circle
                      key={day.date}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8B5CF6"
                    />
                  );
                }
                return null;
              })}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Water Intake Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Water Intake</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {[4, 3, 2, 1].map((value, index) => {
                  const yPosition = chartHeight - (value * 66.66); // Align with actual grid lines: 4L=22.24, 3L=66.68, 2L=111.12, 1L=155.56
                  return (
                    <Text 
                      key={value} 
                      style={[
                        styles.yAxisText, 
                        { 
                          color: theme.textSecondary,
                          position: 'absolute',
                          top: yPosition - 6, // Center text on the line (-6 for half text height)
                          right: 8
                        }
                      ]}
                    >
                      {value}L
                    </Text>
                  );
                })}
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((value) => (
                    <Line
                      key={value}
                      x1={0}
                      y1={chartHeight - (value * 66.66)}
                      x2={chartWidth - 60}
                      y2={chartHeight - (value * 66.66)}
                      stroke={gridLineColor}
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Water intake line */}
                  <Path
                    d={generateWaterIntakeLinePath()}
                    stroke="#3B82F6"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Data points */}
                  {sleepData.map((day, index) => {
                    if (day.waterIntake >= 0) {
                      const x = getXPosition(index);
                      const y = chartHeight - (day.waterIntake * 66.66); // Scale for 0-4.5 liters
                      return (
                        <Circle
                          key={day.date}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#3B82F6"
                        />
                      );
                    }
                    return null;
                  })}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Mood Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Mood</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {[5, 4, 3, 2, 1].map((value, index) => {
                  const yPosition = chartHeight - (value * 60); // 1-5 scale with 40px spacing
                  return (
                    <Text 
                      key={value} 
                      style={[
                        styles.yAxisText, 
                        { 
                          color: theme.textSecondary,
                          position: 'absolute',
                          top: yPosition - 6, // Center text on the line (-6 for half text height)
                          right: 8
                        }
                      ]}
                    >
                      {value === 5 ? 'Excel' : value === 4 ? 'Great' : value === 3 ? 'Good' : value === 2 ? 'Fair' : 'Poor'}
                    </Text>
                  );
                })}
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <Line
                      key={value}
                      x1={0}
                      y1={chartHeight - (value * 60)}
                      x2={chartWidth - 60}
                      y2={chartHeight - (value * 60)}
                      stroke={gridLineColor}
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Mood line */}
                  <Path
                    d={generateMoodLinePath()}
                    stroke="#F59E0B"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Data points */}
                  {sleepData.map((day, index) => {
                    if (day.mood >= 0) {
                      const x = getXPosition(index);
                      const y = chartHeight - (day.mood * 60);
                      return (
                        <Circle
                          key={`mood-${day.date}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#F59E0B"
                        />
                      );
                    }
                    return null;
                  })}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Motivation Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Motivation</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {[5, 4, 3, 2, 1].map((value, index) => {
                  const yPosition = chartHeight - (value * 60); // 1-5 scale with 40px spacing
                  return (
                    <Text 
                      key={value} 
                      style={[
                        styles.yAxisText, 
                        { 
                          color: theme.textSecondary,
                          position: 'absolute',
                          top: yPosition - 6, // Center text on the line (-6 for half text height)
                          right: 8
                        }
                      ]}
                    >
                      {value === 5 ? 'High' : value === 4 ? 'Moti' : value === 3 ? 'Neut' : value === 2 ? 'Unmot' : 'Very'}
                    </Text>
                  );
                })}
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <Line
                      key={value}
                      x1={0}
                      y1={chartHeight - (value * 60)}
                      x2={chartWidth - 60}
                      y2={chartHeight - (value * 60)}
                      stroke={gridLineColor}
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Motivation line */}
                  <Path
                    d={generateMotivationLinePath()}
                    stroke="#60A5FA"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Data points */}
                  {sleepData.map((day, index) => {
                    if (day.motivation >= 0) {
                      const x = getXPosition(index);
                      const y = chartHeight - (day.motivation * 60);
                      return (
                        <Circle
                          key={`motivation-${day.date}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#60A5FA"
                        />
                      );
                    }
                    return null;
                  })}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Stress Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Stress</Text>
            
            {/* Chart with Y-axis labels */}
            <View style={styles.chartWithAxis}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {[5, 4, 3, 2, 1].map((value, index) => {
                  const yPosition = chartHeight - (value * 60); // 1-5 scale with 40px spacing
                  return (
                    <Text 
                      key={value} 
                      style={[
                        styles.yAxisText, 
                        { 
                          color: theme.textSecondary,
                          position: 'absolute',
                          top: yPosition - 6, // Center text on the line (-6 for half text height)
                          right: 8
                        }
                      ]}
                    >
                      {value === 5 ? 'High' : value === 4 ? 'High' : value === 3 ? 'Mod' : value === 2 ? 'Low' : 'Low'}
                    </Text>
                  );
                })}
              </View>
              
              {/* Chart area */}
              <View style={styles.chartArea}>
                <Svg width={chartWidth - 60} height={chartHeight}>
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <Line
                      key={value}
                      x1={0}
                      y1={chartHeight - (value * 60)}
                      x2={chartWidth - 60}
                      y2={chartHeight - (value * 60)}
                      stroke={gridLineColor}
                      strokeWidth={1}
                    />
                  ))}
                  
                  {/* Stress line */}
                  <Path
                    d={generateStressLinePath()}
                    stroke="#EF4444"
                    strokeWidth="3"
                    fill="none"
                  />
                  
                  {/* Data points */}
                  {sleepData.map((day, index) => {
                    if (day.stress >= 0) {
                      const x = getXPosition(index);
                      const y = chartHeight - (day.stress * 60);
                      return (
                        <Circle
                          key={`stress-${day.date}`}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#EF4444"
                        />
                      );
                    }
                    return null;
                  })}
                </Svg>
              </View>
            </View>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabelsContainer}>
              {sleepData.map((day, index) => {
                const x = getXPosition(index);
                return (
                  <View
                    key={day.date}
                    style={[
                      {
                        position: 'absolute',
                        left: x + 4,
                        width: 30,
                        alignItems: 'center'
                      }
                    ]}
                  >
                    {selectedPeriod === 'week' ? (
                      <Text
                        style={[
                          styles.xAxisLabel,
                          { color: theme.textSecondary }
                        ]}
                      >
                        {formatDate(day.date)}
                      </Text>
                    ) : (
                      <View style={styles.monthTick} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        {/* First Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Quality</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.quality >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.quality >= 0).reduce((sum, day) => sum + day.quality, 0) / sleepData.filter(day => day.quality >= 0).length)
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.quality >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgQuality = Math.round(sleepData.filter(day => day.quality >= 0).reduce((sum, day) => sum + day.quality, 0) / sleepData.filter(day => day.quality >= 0).length);
                      if (avgQuality <= 25) return '#EF4444'; // Red
                      if (avgQuality <= 54) return '#F97316'; // Orange
                      return '#10B981'; // Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Sleep</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.hours >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.hours >= 0).reduce((sum, day) => sum + day.hours, 0) / sleepData.filter(day => day.hours >= 0).length * 10) / 10
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.hours >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgHours = Math.round(sleepData.filter(day => day.hours >= 0).reduce((sum, day) => sum + day.hours, 0) / sleepData.filter(day => day.hours >= 0).length * 10) / 10;
                      if (avgHours <= 4) return '#EF4444'; // Red
                      if (avgHours <= 6) return '#F97316'; // Orange
                      return '#10B981'; // Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Water</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.waterIntake >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.waterIntake >= 0).reduce((sum, day) => sum + day.waterIntake, 0) / sleepData.filter(day => day.waterIntake >= 0).length * 10) / 10
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.waterIntake >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgWater = Math.round(sleepData.filter(day => day.waterIntake >= 0).reduce((sum, day) => sum + day.waterIntake, 0) / sleepData.filter(day => day.waterIntake >= 0).length * 10) / 10;
                      if (avgWater <= 1) return '#EF4444'; // Red
                      if (avgWater < 2) return '#F97316'; // Orange
                      return '#10B981'; // Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
        </View>
        
        {/* Second Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Mood</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.mood >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.mood >= 0).reduce((sum, day) => sum + day.mood, 0) / sleepData.filter(day => day.mood >= 0).length * 10) / 10
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.mood >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgMood = Math.round(sleepData.filter(day => day.mood >= 0).reduce((sum, day) => sum + day.mood, 0) / sleepData.filter(day => day.mood >= 0).length * 10) / 10;
                      if (avgMood <= 1) return '#EF4444'; // Red
                      if (avgMood <= 3) return '#F97316'; // Orange
                      return '#10B981'; // Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Motivation</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.motivation >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.motivation >= 0).reduce((sum, day) => sum + day.motivation, 0) / sleepData.filter(day => day.motivation >= 0).length * 10) / 10
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.motivation >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgMotivation = Math.round(sleepData.filter(day => day.motivation >= 0).reduce((sum, day) => sum + day.motivation, 0) / sleepData.filter(day => day.motivation >= 0).length * 10) / 10;
                      if (avgMotivation <= 1) return '#EF4444'; // Red
                      if (avgMotivation < 3) return '#F97316'; // Orange
                      return '#10B981'; // Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Avg Stress</Text>
            <View style={styles.summaryValueContainer}>
              <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
                {sleepData.filter(day => day.stress >= 0).length > 0 
                  ? Math.round(sleepData.filter(day => day.stress >= 0).reduce((sum, day) => sum + day.stress, 0) / sleepData.filter(day => day.stress >= 0).length * 10) / 10
                  : 'N/A'
                }
              </Text>
              {sleepData.filter(day => day.stress >= 0).length > 0 && (
                <View style={[
                  styles.statusDot,
                  { 
                    backgroundColor: (() => {
                      const avgStress = Math.round(sleepData.filter(day => day.stress >= 0).reduce((sum, day) => sum + day.stress, 0) / sleepData.filter(day => day.stress >= 0).length * 10) / 10;
                      if (avgStress >= 4) return '#EF4444'; // High stress -> Red
                      if (avgStress >= 3) return '#F97316'; // Moderate stress -> Orange
                      return '#10B981'; // Low stress -> Green
                    })()
                  }
                ]} />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    width: '100%',
    marginBottom: 20,
    marginHorizontal: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  xAxisLabelsContainer: {
    height: 30,
    position: 'relative',
    marginHorizontal: 20,
  },
  xAxisLabel: {
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  yAxisTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  xAxisTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  monthTick: {
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  chartWithAxis: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxisLabels: {
    width: 50, // Increased width to accommodate longer labels
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 0,
    height: 300,
  },
  yAxisText: {
    fontSize: 12,
    textAlign: 'right',
    paddingRight: 8,
  },
  chartArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  chartsWrapper: {
    flexDirection: 'column',
    paddingHorizontal: 8,
  },
  verticalYAxisLabel: {
    position: 'absolute',
    left: -40,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalYAxisText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  summaryContainer: {
    flexDirection: 'column',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 