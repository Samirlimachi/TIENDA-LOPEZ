import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '@constants/api';
import { Product } from '@models/index';
import { PriceType, useCart } from '@context/CartContext';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

interface Props {
  product: Product | null;
  onClose: () => void;
  onAdded: (product: Product) => void;
}

export const ProductQuickAddModal = ({ product, onClose, onAdded }: Props) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [priceType, setPriceType] = useState<PriceType>('price2');

  const sheetTranslateY = useSharedValue(40);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setPriceType(product.price2 !== null ? 'price2' : 'price');
      sheetTranslateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      sheetTranslateY.value = 40;
      backdropOpacity.value = 0;
    }
  }, [product, sheetTranslateY, backdropOpacity]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!product) {
    return null;
  }

  const hasBothPrices = product.price !== null && product.price2 !== null;
  const price = priceType === 'price' ? product.price : product.price2;
  const subtotal = price ? Number(price) * quantity : 0;

  const handleAdd = () => {
    addItem(product, quantity, priceType);
    onAdded(product);
    onClose();
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <Animated.View style={[styles.sheet, Shadows.card, sheetAnimatedStyle]}>
          <View style={styles.sheetHandle} />

          <View style={styles.header}>
            {product.images.length > 0 ? (
              <Image
                source={{ uri: `${API_BASE_URL}${product.images[0].url}` }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Icon name="image-outline" size={24} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.code}>{product.code}</Text>
              <Text style={styles.stock}>Stock disponible: {product.stock}</Text>
            </View>
          </View>

          {hasBothPrices && (
            <View style={styles.priceTypeRow}>
              <Pressable
                style={[styles.priceTypeChip, priceType === 'price' && styles.priceTypeChipActive]}
                onPress={() => setPriceType('price')}
              >
                <Text
                  style={[
                    styles.priceTypeText,
                    priceType === 'price' && styles.priceTypeTextActive,
                  ]}
                >
                  Mayorista Bs. {product.price}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.priceTypeChip,
                  priceType === 'price2' && styles.priceTypeChipActive,
                ]}
                onPress={() => setPriceType('price2')}
              >
                <Text
                  style={[
                    styles.priceTypeText,
                    priceType === 'price2' && styles.priceTypeTextActive,
                  ]}
                >
                  Por unidad Bs. {product.price2}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantityStepper}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
              >
                <Icon name="remove" size={16} color={Colors.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setQuantity(q => Math.min(product!.stock, q + 1))}
              >
                <Icon name="add" size={16} color={Colors.primary} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Icon name="cart" size={18} color={Colors.white} />
            <Text style={styles.addButtonText}>Agregar al carrito · Bs. {subtotal.toFixed(2)}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
  },
  code: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  stock: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  priceTypeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  priceTypeChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  priceTypeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF0FA',
  },
  priceTypeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  priceTypeTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  quantityLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: SPACING.md,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
