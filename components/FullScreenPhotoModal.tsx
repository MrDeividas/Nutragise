import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FullScreenPhotoModalProps {
  visible: boolean;
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function FullScreenPhotoModal({
  visible,
  photos,
  initialIndex,
  onClose,
}: FullScreenPhotoModalProps) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      // Scroll to initial index when modal opens
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
        }
      }, 100);
    }
  }, [visible, initialIndex]);

  const renderPhoto = ({ item }: { item: string }) => (
    <View style={styles.photoContainer}>
      <Image
        source={{ uri: item }}
        style={styles.photo}
        resizeMode="contain"
      />
    </View>
  );

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  if (!visible || !photos.length) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.9)" barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {/* Photo Counter */}
          {photos.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentIndex + 1} of {photos.length}
              </Text>
            </View>
          )}

          {/* Photo Carousel */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <FlatList
              ref={flatListRef}
              data={photos}
              renderItem={renderPhoto}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              style={styles.carousel}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              initialScrollIndex={initialIndex}
            />
          </TouchableWithoutFeedback>

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
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  counterContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  carousel: {
    flex: 1,
  },
  photoContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: screenWidth,
    height: screenHeight,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 4,
  },
});
