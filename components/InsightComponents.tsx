import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InsightCard } from '../types/insights';

interface StreakInsightProps {
  data: any;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  selectedPeriod: 'past7' | 'currentWeek' | 'last30';
  onPeriodChange: (period: 'past7' | 'currentWeek' | 'last30') => void;
}

export const StreakInsight: React.FC<StreakInsightProps> = ({ 
  data, 
  textPrimary, 
  textSecondary, 
  primary, 
  selectedPeriod, 
  onPeriodChange 
}) => {
  if (!data?.streaks || !Array.isArray(data.streaks)) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.streakData}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[
            styles.periodButton,
            selectedPeriod === 'past7' && { backgroundColor: primary }
          ]}
          onPress={() => onPeriodChange('past7')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === 'past7' ? '#ffffff' : textPrimary }
          ]}>
            Past 7 Days
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.periodButton,
            selectedPeriod === 'currentWeek' && { backgroundColor: primary }
          ]}
          onPress={() => onPeriodChange('currentWeek')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === 'currentWeek' ? '#ffffff' : textPrimary }
          ]}>
            This Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.periodButton,
            selectedPeriod === 'last30' && { backgroundColor: primary }
          ]}
          onPress={() => onPeriodChange('last30')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === 'last30' ? '#ffffff' : textPrimary }
          ]}>
            Last 30 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics Section */}
      {data.keyMetrics && (
        <View style={styles.keyMetricsSection}>
          <Text style={[styles.keyMetricsTitle, { color: textPrimary }]}>
            Key Metrics
          </Text>
          <View style={styles.keyMetricsGrid}>
            <View style={styles.keyMetricItem}>
              <Text style={[styles.keyMetricValue, { color: primary }]}>
                {data.keyMetrics.activeStreaks}
              </Text>
              <Text style={[styles.keyMetricLabel, { color: textSecondary }]}>
                Active Streaks
              </Text>
            </View>
            <View style={styles.keyMetricItem}>
              <Text style={[styles.keyMetricValue, { color: primary }]}>
                {data.keyMetrics.weeklyConsistency}%
              </Text>
              <Text style={[styles.keyMetricLabel, { color: textSecondary }]}>
                Consistency
              </Text>
            </View>
            <View style={styles.keyMetricItem}>
              <Text style={[styles.keyMetricValue, { color: primary }]}>
                {data.keyMetrics.completionRate}%
              </Text>
              <Text style={[styles.keyMetricLabel, { color: textSecondary }]}>
                Completion
              </Text>
            </View>
            {data.keyMetrics.topPerformer && (
              <View style={styles.keyMetricItem}>
                <Text style={[styles.keyMetricValue, { color: primary }]}>
                  {data.keyMetrics.topPerformer}
                </Text>
                <Text style={[styles.keyMetricLabel, { color: textSecondary }]}>
                  Top Habit
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Daily Insights Section */}
      {data.dailyInsights && data.dailyInsights.length > 0 && (
        <View style={styles.dailyInsightsSection}>
          <Text style={[styles.dailyInsightsTitle, { color: textPrimary }]}>
            Today's Insights
          </Text>
          {data.dailyInsights.map((insight: any, insightIndex: number) => (
            <View key={insightIndex} style={styles.dailyInsightItem}>
              <View style={styles.dailyInsightHeader}>
                <Ionicons 
                  name={insight.icon as any} 
                  size={16} 
                  color={insight.type === 'achievement' ? '#4CAF50' : 
                         insight.type === 'warning' ? '#FF9800' : 
                         insight.type === 'tip' ? '#2196F3' : 
                         insight.type === 'pattern' ? '#9C27B0' : '#607D8B'} 
                />
                <Text style={[styles.dailyInsightTitle, { color: textPrimary }]}>
                  {insight.title}
                </Text>
              </View>
              <Text style={[styles.dailyInsightMessage, { color: textSecondary }]}>
                {insight.message}
              </Text>
              {insight.actionable && insight.actionText && (
                <TouchableOpacity style={styles.dailyInsightAction}>
                  <Text style={[styles.dailyInsightActionText, { color: primary }]}>
                    {insight.actionText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
};

interface PatternInsightProps {
  data: any;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  insights: InsightCard[];
  setInsights: (insights: InsightCard[]) => void;
  index: number;
}

export const PatternInsight: React.FC<PatternInsightProps> = ({ 
  data, 
  textPrimary, 
  textSecondary, 
  primary, 
  insights, 
  setInsights, 
  index 
}) => {
  const toggleConsistencyInfo = () => {
    const updatedInsights = insights.map((ins, i) => 
      i === index ? { ...ins, showConsistencyInfo: !ins.showConsistencyInfo } : ins
    );
    setInsights(updatedInsights);
  };

  if (data?.consistencyScore !== undefined && data.consistencyScore > 0 && data.totalDays >= 14) {
    return (
      <View style={styles.patternData}>
        {/* Weekly Consistency Section */}
        <View style={styles.patternSection}>
          <View style={styles.patternHeader}>
            <Text style={[styles.patternLabel, { color: textSecondary }]}>
              Weekly Consistency:
            </Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={toggleConsistencyInfo}
            >
              <Ionicons name="information-circle" size={16} color={textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.patternValue, { color: primary }]}>
            {data.consistencyScore.toFixed(1)}%
          </Text>
          {insights[index]?.showConsistencyInfo && (
            <View>
              <Text style={[styles.patternDescription, { color: textSecondary }]}>
                How evenly you complete habits across all days of the week
              </Text>
              <View style={styles.patternBreakdown}>
                <Text style={[styles.patternBreakdownTitle, { color: textPrimary }]}>
                  What this means:
                </Text>
                <Text style={[styles.patternBreakdownItem, { color: textSecondary }]}>
                  • Higher score = More consistent across all days
                </Text>
                <Text style={[styles.patternBreakdownItem, { color: textSecondary }]}>
                  • Lower score = Some days much better than others
                </Text>
                <Text style={[styles.patternBreakdownItem, { color: textSecondary }]}>
                  • Based on sleep, water, exercise, and reflection data
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sleep Quality Pattern */}
        {data?.sleepPatterns?.peakDay && (
          <View style={styles.patternSection}>
            <Text style={[styles.patternLabel, { color: textSecondary }]}>
              Sleep Quality Pattern:
            </Text>
            <Text style={[styles.patternValue, { color: primary }]}>
              Best on {data.sleepPatterns.peakDay.charAt(0).toUpperCase() + data.sleepPatterns.peakDay.slice(1)}s
            </Text>
          </View>
        )}

        {/* Water Intake Pattern */}
        {data?.waterPatterns?.peakDay && (
          <View style={styles.patternSection}>
            <Text style={[styles.patternLabel, { color: textSecondary }]}>
              Water Intake Pattern:
            </Text>
            <Text style={[styles.patternValue, { color: primary }]}>
              Best on {data.waterPatterns.peakDay.charAt(0).toUpperCase() + data.waterPatterns.peakDay.slice(1)}s
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Not enough data state
  return (
    <View style={styles.patternNoData}>
      <Ionicons name="calendar" size={24} color={textSecondary} style={styles.patternNoDataIcon} />
      <Text style={[styles.patternNoDataTitle, { color: textPrimary }]}>
        Not Enough Data Yet
      </Text>
      <Text style={[styles.patternNoDataDescription, { color: textSecondary }]}>
        Complete at least 7 days of habits to discover your weekly patterns and consistency trends.
      </Text>
      <View style={styles.patternNoDataRequirements}>
        <Text style={[styles.patternNoDataRequirementsTitle, { color: textPrimary }]}>
          What you can discover:
        </Text>
        <View style={styles.patternNoDataRequirementsList}>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Your best days of the week
          </Text>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Consistency scores
          </Text>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Weekly trends
          </Text>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Peak performance days
          </Text>
        </View>
      </View>
      <View style={styles.patternNoDataRequirements}>
        <Text style={[styles.patternNoDataRequirementsTitle, { color: textPrimary }]}>
          What you need:
        </Text>
        <View style={styles.patternNoDataRequirementsList}>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • At least 7 days of habit data
          </Text>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Multiple habit types completed
          </Text>
          <Text style={[styles.patternNoDataRequirementsItem, { color: textSecondary }]}>
            • Consistent tracking
          </Text>
        </View>
      </View>
    </View>
  );
};

interface CorrelationInsightProps {
  data: any;
  textPrimary: string;
  textSecondary: string;
}

export const CorrelationInsight: React.FC<CorrelationInsightProps> = ({ data, textPrimary, textSecondary }) => {
  if (data?.correlations && data.correlations.length > 0) {
    return (
      <View style={styles.correlationData}>
        {data.correlations.map((correlation: any, corrIndex: number) => (
          <View key={corrIndex} style={styles.correlationItem}>
            <View style={styles.correlationHeader}>
              <Text style={[styles.correlationTitle, { color: textPrimary }]}>
                {correlation.title}
              </Text>
              <Text style={[styles.correlationStrength, { color: textSecondary }]}>
                {correlation.strength}
              </Text>
            </View>
            <Text style={[styles.correlationDescription, { color: textPrimary }]}>
              {correlation.description}
            </Text>
            <Text style={[styles.correlationRecommendation, { color: textSecondary }]}>
              {correlation.recommendation}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // Not enough data state
  return (
    <View style={styles.correlationNoData}>
      <Ionicons name="link" size={24} color={textSecondary} style={styles.correlationNoDataIcon} />
      <Text style={[styles.correlationNoDataTitle, { color: textPrimary }]}>
        Not Enough Data Yet
      </Text>
      <Text style={[styles.correlationNoDataDescription, { color: textSecondary }]}>
        Complete at least 5 days of habits with mood and energy ratings to discover how your habits affect each other.
      </Text>
      <View style={styles.correlationNoDataRequirements}>
        <Text style={[styles.correlationNoDataRequirementsTitle, { color: textPrimary }]}>
          What you need:
        </Text>
        <View style={styles.correlationNoDataRequirementsList}>
          <Text style={[styles.correlationNoDataRequirementsItem, { color: textSecondary }]}>
            • Sleep data (quality or hours)
          </Text>
          <Text style={[styles.correlationNoDataRequirementsItem, { color: textSecondary }]}>
            • Mood ratings (1-5 scale)
          </Text>
          <Text style={[styles.correlationNoDataRequirementsItem, { color: textSecondary }]}>
            • Energy ratings (1-5 scale)
          </Text>
          <Text style={[styles.correlationNoDataRequirementsItem, { color: textSecondary }]}>
            • At least 5 days of data
          </Text>
        </View>
      </View>
    </View>
  );
};

interface RecommendationInsightProps {
  data: any;
  textSecondary: string;
}

export const RecommendationInsight: React.FC<RecommendationInsightProps> = ({ data, textSecondary }) => {
  if (!data?.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.recommendationData}>
      {data.recommendations.slice(1).map((rec: string, recIndex: number) => (
        <Text key={recIndex} style={[styles.recommendationItem, { color: textSecondary }]}>
          • {rec || 'No recommendation'}
        </Text>
      ))}
    </View>
  );
};

const styles = {
  streakData: {
    gap: 8,
  },
  streakItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  streakLabel: {
    fontSize: 12,
    textTransform: 'capitalize' as const,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  // Daily Insights Styles
  dailyInsightsSection: {
    marginBottom: 16,
    gap: 12,
  },
  dailyInsightsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  dailyInsightItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  dailyInsightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  dailyInsightTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dailyInsightMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  dailyInsightAction: {
    alignSelf: 'flex-start' as const,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyInsightActionText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  // Key Metrics Styles
  keyMetricsSection: {
    marginBottom: 16,
    gap: 12,
  },
  keyMetricsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  keyMetricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  keyMetricItem: {
    alignItems: 'center' as const,
    minWidth: 60,
  },
  keyMetricValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  keyMetricLabel: {
    fontSize: 10,
    textAlign: 'center' as const,
  },
  // Streaks Section Styles
  streaksSection: {
    gap: 8,
  },
  streaksSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  patternData: {
    gap: 16,
  },
  patternSection: {
    gap: 8,
  },
  patternLabel: {
    fontSize: 12,
  },
  patternHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  infoButton: {
    padding: 2,
  },
  patternValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  patternDescription: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  patternBreakdown: {
    marginTop: 12,
    gap: 6,
  },
  patternBreakdownTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  patternBreakdownItem: {
    fontSize: 11,
    lineHeight: 14,
  },
  patternNoData: {
    alignItems: 'center' as const,
    padding: 16,
  },
  patternNoDataIcon: {
    marginBottom: 12,
  },
  patternNoDataTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  patternNoDataDescription: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  patternNoDataRequirements: {
    width: '100%',
    marginBottom: 12,
  },
  patternNoDataRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  patternNoDataRequirementsList: {
    gap: 4,
  },
  patternNoDataRequirementsItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  correlationData: {
    gap: 16,
  },
  correlationItem: {
    gap: 8,
  },
  correlationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  correlationTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  correlationStrength: {
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  correlationDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  correlationRecommendation: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
  correlationNoData: {
    alignItems: 'center' as const,
    padding: 16,
  },
  correlationNoDataIcon: {
    marginBottom: 12,
  },
  correlationNoDataTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  correlationNoDataDescription: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  correlationNoDataRequirements: {
    width: '100%',
  },
  correlationNoDataRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  correlationNoDataRequirementsList: {
    gap: 4,
  },
  correlationNoDataRequirementsItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  recommendationData: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  periodSelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    minWidth: 80,
    alignItems: 'center' as const,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};
