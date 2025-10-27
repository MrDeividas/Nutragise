import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, FlatList } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface GesturePhotoCarouselProps {
  photos: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPhotoPress?: () => void;
  style?: any;
}

export default function GesturePhotoCarousel({ 
  photos, 
  currentIndex, 
  onIndexChange, 
  onPhotoPress,
  style 
}: GesturePhotoCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  if (!photos || photos.length === 0) return null;

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.photoContainer} 
      onPress={onPhotoPress}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item }} 
        style={styles.photo} 
        resizeMode="cover" 
      />
    </TouchableOpacity>
  );

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex) {
        onIndexChange(index);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item, index) => `photo_${index}_${item}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        style={styles.carousel}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        getItemLayout={(_, index) => ({
          length: screenWidth - 40,
          offset: (screenWidth - 40) * index,
          index,
        })}
        initialScrollIndex={currentIndex}
        removeClippedSubviews={false}
        decelerationRate="fast"
        snapToInterval={screenWidth - 40}
        snapToAlignment="start"
      />
      
      {/* Navigation Dots */}
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot, 
                { 
                  backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                  width: index === currentIndex ? 8 : 6,
                  height: index === currentIndex ? 8 : 6,
                }
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  carousel: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoContainer: {
    width: screenWidth - 60,
    height: (screenWidth - 60) * 0.75,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    gap: 4,
    zIndex: 1,
  },
  dot: {
    borderRadius: 4,
  },
});
