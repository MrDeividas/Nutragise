import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../state/themeStore';

interface InsightSkeletonProps {
  type: 'card' | 'list' | 'detail';
}

export const InsightSkeleton: React.FC<InsightSkeletonProps> = ({ type }) => {
  const { textSecondary } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'card') {
    return (
      <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
        <View style={styles.cardHeader}>
          <Animated.View 
            style={[
              styles.iconSkeleton, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                opacity 
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.titleSkeleton, 
              { 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                opacity 
              }
            ]} 
          />
        </View>
        <Animated.View 
          style={[
            styles.descriptionSkeleton, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              opacity 
            }
          ]} 
        />
      </View>
    );
  }

  if (type === 'list') {
    return (
      <View style={styles.listContainer}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.listItem, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
            <Animated.View 
              style={[
                styles.listIconSkeleton, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity 
                }
              ]} 
            />
            <View style={styles.listContent}>
              <Animated.View 
                style={[
                  styles.listTitleSkeleton, 
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    opacity 
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.listSubtitleSkeleton, 
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    opacity 
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'detail') {
    return (
      <View style={styles.detailContainer}>
        <Animated.View 
          style={[
            styles.detailHeaderSkeleton, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              opacity 
            }
          ]} 
        />
        <View style={styles.detailContent}>
          {[1, 2, 3].map((item) => (
            <Animated.View 
              key={item}
              style={[
                styles.detailItemSkeleton, 
                { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity 
                }
              ]} 
            />
          ))}
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  titleSkeleton: {
    height: 16,
    width: 120,
    borderRadius: 4,
  },
  descriptionSkeleton: {
    height: 12,
    width: '80%',
    borderRadius: 4,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitleSkeleton: {
    height: 14,
    width: 100,
    borderRadius: 4,
  },
  listSubtitleSkeleton: {
    height: 12,
    width: 80,
    borderRadius: 4,
  },
  detailContainer: {
    padding: 16,
  },
  detailHeaderSkeleton: {
    height: 20,
    width: 150,
    borderRadius: 4,
    marginBottom: 16,
  },
  detailContent: {
    gap: 12,
  },
  detailItemSkeleton: {
    height: 16,
    width: '100%',
    borderRadius: 4,
  },
});
