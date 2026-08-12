import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, BorderRadius } from '@theme/index';
import { SPACING } from '@constants/dimensions';

export interface TagItem {
  id: number;
  name: string;
}

interface Props {
  label: string;
  items: TagItem[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onCreate: (name: string) => Promise<void>;
  allowClear?: boolean;
  clearLabel?: string;
}

const SEARCH_THRESHOLD = 8;
const SCROLL_THRESHOLD = 12;

export const TagPicker = ({
  label,
  items,
  selectedId,
  onSelect,
  onCreate,
  allowClear = false,
  clearLabel = 'Ninguna',
}: Props) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }
    setSaving(true);
    try {
      await onCreate(newName.trim());
      setNewName('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter(item => item.name.toLowerCase().includes(query));
  }, [items, search]);

  const showSearch = items.length > SEARCH_THRESHOLD;
  const useScroll = items.length > SCROLL_THRESHOLD;

  const chips = (
    <View style={styles.row}>
      {allowClear && (
        <TouchableOpacity
          style={[styles.chip, selectedId === null && styles.chipActive]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.chipText, selectedId === null && styles.chipTextActive]}>
            {clearLabel}
          </Text>
        </TouchableOpacity>
      )}
      {filteredItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.chip, selectedId === item.id && styles.chipActive]}
          onPress={() => onSelect(item.id)}
        >
          <Text style={[styles.chipText, selectedId === item.id && styles.chipTextActive]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
      {filteredItems.length === 0 && (
        <Text style={styles.emptyText}>Sin resultados</Text>
      )}
    </View>
  );

  return (
    <View>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.countBadge}>{items.length}</Text>
        </View>
      ) : null}

      {showSearch && (
        <View style={styles.searchRow}>
          <Icon name="search" size={14} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      )}

      {useScroll ? (
        <ScrollView style={styles.scrollBox} nestedScrollEnabled>
          {chips}
        </ScrollView>
      ) : (
        chips
      )}

      <TouchableOpacity
        style={styles.addChip}
        onPress={() => setAdding(!adding)}
        activeOpacity={0.7}
      >
        <Icon
          name={adding ? 'close' : 'add'}
          size={15}
          color={Colors.secondary}
        />
        <Text style={styles.addChipText}>{adding ? 'Cancelar' : 'Agregar nuevo'}</Text>
      </TouchableOpacity>

      {adding && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder={`Nuevo/a ${label.toLowerCase()}`}
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.addButton, saving && styles.addButtonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            <Text style={styles.addButtonText}>{saving ? '...' : 'Agregar'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  countBadge: {
    color: Colors.textMuted,
    fontSize: 11,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.xs,
    minWidth: 20,
    textAlign: 'center',
    overflow: 'hidden',
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
    fontSize: 13,
    color: Colors.text,
  },
  scrollBox: {
    maxHeight: 220,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    paddingVertical: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FCEDEB',
    marginTop: SPACING.sm,
  },
  addChipText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  addInput: {
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
  addButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
});
