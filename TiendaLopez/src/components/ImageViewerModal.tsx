import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '@constants/api';
import { Colors } from '@theme/index';
import { SPACING } from '@constants/dimensions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewerModal = ({ visible, images, initialIndex = 0, onClose }: Props) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
          <Icon name="close" size={26} color={Colors.white} />
        </Pressable>

        <FlatList
          data={images}
          keyExtractor={(uri, index) => uri + index}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <Image
                source={{ uri: `${API_BASE_URL}${item}` }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {images.length > 1 && (
          <View style={styles.footer}>
            <Text style={styles.counter}>
              {activeIndex + 1} / {images.length}
            </Text>
            <View style={styles.dots}>
              {images.map((uri, index) => (
                <View
                  key={uri + index}
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 1,
    padding: SPACING.xs,
  },
  page: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  counter: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: Colors.white,
  },
});
