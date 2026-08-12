import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

export interface HeaderMenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  items: HeaderMenuItem[];
}

export const HeaderMenu = ({ items }: Props) => {
  const [visible, setVisible] = useState(false);

  const sheetTranslateY = useSharedValue(40);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      sheetTranslateY.value = 40;
      backdropOpacity.value = 0;
    }
  }, [visible, sheetTranslateY, backdropOpacity]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handlePress = (item: HeaderMenuItem) => {
    setVisible(false);
    item.onPress();
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)} hitSlop={8}>
        <Icon name="menu" size={20} color={Colors.primary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.backdropTouchable} onPress={() => setVisible(false)} />
          <Animated.View style={[styles.sheet, Shadows.card, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />
            {items.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.item, index === items.length - 1 && styles.itemLast]}
                onPress={() => handlePress(item)}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  color={item.destructive ? Colors.danger : Colors.primary}
                />
                <Text style={[styles.itemText, item.destructive && styles.itemTextDestructive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 73, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  itemTextDestructive: {
    color: Colors.danger,
  },
});
