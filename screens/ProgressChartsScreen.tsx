import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { useAuthStore } from '../state/authStore';
import { DailyHabits } from '../types/database';
import Svg, { Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import CustomBackground from '../components/CustomBackground';
import { useBottomNavPadding } from '../components/CustomTabBar';

export default function ProgressChartsScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const [sleepData, setSleepData] = useState<Array<{ date: string; quality: number; hours: number; waterIntake: number; mood: number; motivation: number; stress: number; distance: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.15)';
  
  // Chart dimensions
  const chartWidth = 340; // Fixed width for modal
  const chartHeight = 300;
  
  // Helper function to calculate X position for data points
  const getXPosition = (index: number) => {
    const chartAreaWidth = (chartWidth - 60);
    const segmentWidth = chartAreaWidth / sleepData.length;
    return segmentWidth * index + segmentWidth / 2; // Center each point in its segment
  };

  // Helper function to convert percentage (0-100) to 1-4 scale
  const convertSleepQualityToScale = (percentage: number) => {
    if (percentage <= 25) return 1;
    if (percentage <= 50) return 2;
    if (percentage <= 75) return 3;
    return 4;
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
            y: chartHeight - (scaledQuality * 60),
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

  // Water Intake line path
  const generateWaterLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => ({
        x: getXPosition(index),
        y: chartHeight - (day.waterIntake * 66.66),
        hasData: day.waterIntake >= 0
      }))
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  // Mood line path
  const generateMoodLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const validPoints = sleepData
      .map((day, index) => ({
        x: getXPosition(index),
        y: chartHeight - (day.mood * 60),
        hasData: day.mood >= 0
      }))
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };


  // Distance chart config
  const getDistanceChartConfig = () => {
    const distances = sleepData.map(day => day.distance).filter(d => d >= 0);
    if (distances.length === 0) {
      return { max: 5, pixelsPerKm: 60, gridLines: [0, 1, 2, 3, 4, 5] };
    }
    
    const maxDistance = Math.max(...distances);
    
    if (maxDistance <= 5) {
      return { max: 5, pixelsPerKm: 60, gridLines: [0, 1, 2, 3, 4, 5] };
    } else if (maxDistance <= 10) {
      return { max: 10, pixelsPerKm: 30, gridLines: [0, 2, 4, 6, 8, 10] };
    } else {
      const roundedMax = Math.ceil(maxDistance / 5) * 5;
      const pixelsPerKm = chartHeight / roundedMax;
      const step = roundedMax / 5;
      const gridLines = Array.from({ length: 6 }, (_, i) => i * step);
      return { max: roundedMax, pixelsPerKm, gridLines };
    }
  };

  // Distance line path
  const generateDistanceLinePath = () => {
    if (sleepData.length === 0) return '';
    
    const config = getDistanceChartConfig();
    const validPoints = sleepData
      .map((day, index) => ({
        x: getXPosition(index),
        y: chartHeight - (day.distance * config.pixelsPerKm),
        hasData: day.distance >= 0
      }))
      .filter(point => point.hasData);
    
    if (validPoints.length === 0) return '';
    
    return validPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedPeriod]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 6);
      } else {
        startDate.setDate(endDate.getDate() - 29);
      }
      
      const habits = await dailyHabitsService.getDailyHabitsRange(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const sleep: Array<{ date: string; quality: number; hours: number; waterIntake: number; mood: number; motivation: number; stress: number; distance: number }> = [];
      const totalDays = selectedPeriod === 'week' ? 7 : 30;
      
      for (let i = totalDays - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayHabits = habits.find(h => h.date === dateStr);
        
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
    } catch (error) {
      console.error('Error loading data:', error);
      // Even on error, set empty data so charts can render
      const sleep: Array<{ date: string; quality: number; hours: number; waterIntake: number; mood: number; motivation: number; stress: number; distance: number }> = [];
      const totalDays = selectedPeriod === 'week' ? 7 : 30;
      const endDate = new Date();
      
      for (let i = totalDays - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - i);
        sleep.push({
          date: date.toISOString().split('T')[0],
          quality: -1,
          hours: -1,
          waterIntake: -1,
          mood: -1,
          motivation: -1,
          stress: -1,
          distance: -1
        });
      }
      setSleepData(sleep);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Progress Charts</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={48} color={theme.textSecondary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading progress...</Text>
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Progress Charts</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 20 }}
        >
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[
                styles.periodButtonText,
                { color: selectedPeriod === 'week' ? '#FFFFFF' : theme.textPrimary }
              ]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[
                styles.periodButtonText,
                { color: selectedPeriod === 'month' ? '#FFFFFF' : theme.textPrimary }
              ]}>
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Charts Container */}
          <View style={styles.chartsContainer}>
            {/* Sleep Quality Chart */}
            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Sleep Quality</Text>
              <View style={styles.chartWithAxis}>
                <View style={styles.yAxisLabels}>
                  {['Excel', 'Good', 'Fair', 'Poor'].map((label, index) => {
                    const yPosition = (index + 1) * 60;
                    return (
                      <Text 
                        key={label} 
                        style={[
                          styles.yAxisText, 
                          { 
                            color: theme.textSecondary,
                            position: 'absolute',
                            top: yPosition - 6,
                            right: 8
                          }
                        ]}
                      >
                        {label}
                      </Text>
                    );
                  })}
                </View>
                <View style={styles.chartArea}>
                  <Svg width={chartWidth - 60} height={chartHeight}>
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
                    <Path
                      d={generateQualityLinePath()}
                      stroke="#8B5CF6"
                      strokeWidth="3"
                      fill="none"
                    />
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

            {/* Sleep Hours Chart */}
            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Sleep Hours</Text>
              <View style={styles.chartWithAxis}>
                <View style={styles.yAxisLabels}>
                  {[12, 10, 8, 6, 4, 2, 0].map((value) => {
                    const yPosition = chartHeight - (value * 25);
                    return (
                      <Text 
                        key={value} 
                        style={[
                          styles.yAxisText, 
                          { 
                            color: theme.textSecondary,
                            position: 'absolute',
                            top: yPosition - 6,
                            right: 8
                          }
                        ]}
                      >
                        {value}h
                      </Text>
                    );
                  })}
                </View>
                <View style={styles.chartArea}>
                  <Svg width={chartWidth - 60} height={chartHeight}>
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
                    <Path
                      d={generateHoursLinePath()}
                      stroke="#10B981"
                      strokeWidth="3"
                      fill="none"
                    />
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
            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Water Intake</Text>
              <View style={styles.chartWithAxis}>
                <View style={styles.yAxisLabels}>
                  {[4, 3, 2, 1].map((value) => {
                    const yPosition = chartHeight - (value * 66.66);
                    return (
                      <Text 
                        key={value} 
                        style={[
                          styles.yAxisText, 
                          { 
                            color: theme.textSecondary,
                            position: 'absolute',
                            top: yPosition - 6,
                            right: 8
                          }
                        ]}
                      >
                        {value}L
                      </Text>
                    );
                  })}
                </View>
                <View style={styles.chartArea}>
                  <Svg width={chartWidth - 60} height={chartHeight}>
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
                    <Path
                      d={generateWaterLinePath()}
                      stroke="#3B82F6"
                      strokeWidth="3"
                      fill="none"
                    />
                    {sleepData.map((day, index) => {
                      if (day.waterIntake >= 0) {
                        const x = getXPosition(index);
                        const y = chartHeight - (day.waterIntake * 66.66);
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
            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Mood</Text>
              <View style={styles.chartWithAxis}>
                <View style={styles.yAxisLabels}>
                  {[5, 4, 3, 2, 1].map((value) => {
                    const yPosition = chartHeight - (value * 60);
                    return (
                      <Text 
                        key={value} 
                        style={[
                          styles.yAxisText, 
                          { 
                            color: theme.textSecondary,
                            position: 'absolute',
                            top: yPosition - 6,
                            right: 8
                          }
                        ]}
                      >
                        {value}
                      </Text>
                    );
                  })}
                </View>
                <View style={styles.chartArea}>
                  <Svg width={chartWidth - 60} height={chartHeight}>
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
                    <Path
                      d={generateMoodLinePath()}
                      stroke="#F59E0B"
                      strokeWidth="3"
                      fill="none"
                    />
                    {sleepData.map((day, index) => {
                      if (day.mood >= 0) {
                        const x = getXPosition(index);
                        const y = chartHeight - (day.mood * 60);
                        return (
                          <Circle
                            key={day.date}
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

            {/* Distance Chart */}
            <View style={styles.chartBox}>
              <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Distance Covered</Text>
              <View style={styles.chartWithAxis}>
                <View style={styles.yAxisLabels}>
                  {(() => {
                    const config = getDistanceChartConfig();
                    return config.gridLines.slice().reverse().map((value) => {
                      const yPosition = (value / config.max) * chartHeight;
                      return (
                        <Text 
                          key={value} 
                          style={[
                            styles.yAxisText, 
                            { 
                              color: theme.textSecondary,
                              position: 'absolute',
                              top: yPosition - 6,
                              right: 8
                            }
                          ]}
                        >
                          {value}km
                        </Text>
                      );
                    });
                  })()}
                </View>
                <View style={styles.chartArea}>
                  <Svg width={chartWidth - 60} height={chartHeight}>
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
                    <Path
                      d={generateDistanceLinePath()}
                      stroke="#DC2626"
                      strokeWidth="3"
                      fill="none"
                    />
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
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 20,
    position: 'relative',
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 24,
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
  chartsContainer: {
    paddingHorizontal: 24,
  },
  chartBox: {
    marginBottom: 20,
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
  },
  chartWithAxis: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 60,
    height: 300,
    position: 'relative',
  },
  yAxisText: {
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
  },
  xAxisLabelsContainer: {
    height: 30,
    position: 'relative',
    marginLeft: 60,
  },
  xAxisLabel: {
    fontSize: 10,
  },
  monthTick: {
    width: 2,
    height: 4,
    backgroundColor: '#9CA3AF',
    opacity: 0.3,
  },
});

