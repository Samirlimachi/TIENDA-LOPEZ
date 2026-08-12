import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

export interface DropdownItem {
  id: number;
  name: string;
}

interface Props {
  label: string;
  icon?: string;
  items: DropdownItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  allLabel?: string;
  allowNull?: boolean;
  onCreate?: (name: string) => Promise<void>;
}

export const Dropdown = ({
  label,
  icon,
  items,
  selectedId,
  onSelect,
  allLabel = 'Todas',
  allowNull = true,
  onCreate,
}: Props) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const selectedName = items.find(item => item.id === selectedId)?.name ?? allLabel;
  const isActive = selectedId !== null;

  const sheetTranslateY = useSharedValue(40);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      sheetTranslateY.value = 40;
      backdropOpacity.value = 0;
      setSearch('');
      setNewName('');
    }
  }, [visible, sheetTranslateY, backdropOpacity]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSelect = (id: number | null) => {
    onSelect(id);
    setVisible(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !onCreate) {
      return;
    }
    setCreating(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
      setVisible(false);
    } finally {
      setCreating(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = allowNull ? [{ id: null as number | null, name: allLabel }, ...items] : items;
    if (!query) {
      return base;
    }
    return base.filter(item => item.name.toLowerCase().includes(query));
  }, [items, search, allowNull, allLabel]);

  return (
    <>
      <Pressable
        style={[styles.field, isActive && styles.fieldActive]}
        onPress={() => setVisible(true)}
      >
        {icon && (
          <Icon
            name={icon}
            size={14}
            color={isActive ? Colors.primary : Colors.textMuted}
            style={styles.fieldIcon}
          />
        )}
        <View style={styles.fieldTextWrapper}>
          <Text style={[styles.fieldLabel, isActive && styles.fieldLabelActive]}>{label}</Text>
          <Text
            style={[styles.fieldValue, isActive && styles.fieldValueActive]}
            numberOfLines={1}
          >
            {selectedName}
          </Text>
        </View>
        <Icon
          name="chevron-down"
          size={16}
          color={isActive ? Colors.primary : Colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView style={styles.keyboardAvoider} behavior="height">
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={styles.backdropTouchable} onPress={() => setVisible(false)} />
          <Animated.View style={[styles.sheet, Shadows.card, sheetAnimatedStyle]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>

            {items.length > 6 && (
              <View style={styles.searchRow}>
                <Icon name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar..."
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={item => String(item.id)}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable style={styles.option} onPress={() => handleSelect(item.id)}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedId === item.id && styles.optionTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedId === item.id && (
                    <Icon name="checkmark" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Sin resultados</Text>
              }
            />

            {onCreate && (
              <View style={styles.createRow}>
                <TextInput
                  style={styles.createInput}
                  placeholder={`Nuevo/a ${label.toLowerCase()}`}
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
                <Pressable style={styles.createButton} onPress={handleCreate} disabled={creating}>
                  <Text style={styles.createButtonText}>{creating ? '...' : 'Agregar'}</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: Colors.surface,
  },
  fieldActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF0FA',
  },
  fieldIcon: {
    marginRight: 6,
  },
  fieldTextWrapper: {
    flex: 1,
    flexShrink: 1,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  fieldLabelActive: {
    color: Colors.primary,
  },
  fieldValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldValueActive: {
    color: Colors.primary,
  },
  keyboardAvoider: {
    flex: 1,
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
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    color: Colors.text,
  },
  list: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    color: Colors.text,
    fontSize: 15,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    paddingVertical: SPACING.md,
  },
  createRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  createInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  createButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  createButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
});
