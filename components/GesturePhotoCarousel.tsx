import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, FlatList, Text } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface GesturePhotoCarouselProps {
  photos: string[];
  captions?: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onPhotoPress?: () => void;
  style?: any;
}

export default function GesturePhotoCarousel({ 
  photos, 
  captions,
  currentIndex, 
  onIndexChange, 
  onPhotoPress,
  style 
}: GesturePhotoCarouselProps) {
  const flatListRef = useRef<FlatList>(null);

  if (!photos || photos.length === 0) return null;

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const caption = captions?.[index];
    const hasCaption = caption && caption.trim() !== '';
    
    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity 
          style={styles.photoTouchable} 
          onPress={onPhotoPress}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item }} 
            style={styles.photo} 
            resizeMode="cover" 
          />
        </TouchableOpacity>
        {hasCaption && (
          <Text style={styles.caption}>{caption}</Text>
        )}
      </View>
    );
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex) {
        onIndexChange(index);
      }
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
        contentContainerStyle={{ paddingHorizontal: 0 }}
        getItemLayout={(_, index) => ({
          length: 172,
          offset: 172 * index,
          index,
        })}
        initialScrollIndex={currentIndex}
        removeClippedSubviews={false}
        decelerationRate="fast"
        snapToInterval={172}
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  carousel: {
    borderRadius: 12,
  },
  photoContainer: {
    width: 160,
    marginRight: 12,
  },
  photoTouchable: {
    width: 160,
    height: 200, // 4:5 aspect ratio (160 * 5/4 = 200)
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    width: 160,
  },
});
