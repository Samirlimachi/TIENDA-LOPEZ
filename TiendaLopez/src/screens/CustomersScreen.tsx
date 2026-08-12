import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createCustomer, getCustomers, updateCustomer } from '@services/customers';
import { Customer } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

export const CustomersScreen = ({ navigation, route }: any) => {
  const onSave = route.params?.onSave as ((customer: Customer) => void) | undefined;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [ci, setCi] = useState('');
  const [nit, setNit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const data = await getCustomers();
    setCustomers(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        (c.ci ?? '').toLowerCase().includes(query) ||
        (c.nit ?? '').toLowerCase().includes(query),
    );
  }, [customers, search]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCi('');
    setNit('');
    setError(null);
  };

  const handleStartEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setCi(customer.ci ?? '');
    setNit(customer.nit ?? '');
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Ingresá el nombre del cliente');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (editingId !== null) {
        const updated = await updateCustomer(
          editingId,
          name.trim(),
          ci.trim() || null,
          nit.trim() || null,
        );
        setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        resetForm();
        return;
      }
      const created = await createCustomer(name.trim(), ci.trim() || null, nit.trim() || null);
      setCustomers(prev => [...prev, created]);
      setName('');
      setCi('');
      setNit('');
      if (onSave) {
        onSave(created);
        navigation.goBack();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clientes</Text>
        <View style={{ width: 72 }} />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={[styles.formCard, Shadows.card]}>
              <View style={styles.formHeader}>
                <Icon
                  name={editingId !== null ? 'create' : 'person-add'}
                  size={16}
                  color={Colors.primary}
                />
                <Text style={styles.formTitle}>
                  {editingId !== null ? 'Editar cliente' : 'Nuevo cliente'}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ej: Juana Pérez"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.idRow}>
                <View style={styles.idField}>
                  <Text style={styles.fieldLabel}>CI (opcional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Ej: 1234567"
                    placeholderTextColor={Colors.textMuted}
                    value={ci}
                    onChangeText={setCi}
                  />
                </View>
                <View style={styles.idField}>
                  <Text style={styles.fieldLabel}>NIT (opcional)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Ej: 1234567890"
                    placeholderTextColor={Colors.textMuted}
                    value={nit}
                    onChangeText={setNit}
                  />
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.formActions}>
                {editingId !== null && (
                  <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving
                      ? 'Guardando...'
                      : editingId !== null
                        ? 'Guardar cambios'
                        : onSave
                          ? 'Guardar y usar en la venta'
                          : 'Guardar cliente'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, CI o NIT..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No hay clientes que coincidan</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.customerCard, Shadows.card]}
            onPress={() => {
              if (onSave) {
                onSave(item);
                navigation.goBack();
              }
            }}
            activeOpacity={onSave ? 0.7 : 1}
          >
            <View style={styles.customerIcon}>
              <Icon name="person" size={16} color={Colors.primary} />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              {(item.ci || item.nit) && (
                <Text style={styles.customerMeta}>
                  {item.ci ? `CI ${item.ci}` : ''}
                  {item.ci && item.nit ? ' · ' : ''}
                  {item.nit ? `NIT ${item.nit}` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleStartEdit(item)}
              hitSlop={8}
            >
              <Icon name="create-outline" size={18} color={Colors.secondary} />
            </TouchableOpacity>
            {onSave && <Icon name="chevron-forward" size={18} color={Colors.textMuted} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 72,
  },
  back: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  idRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  idField: {
    flex: 1,
  },
  error: {
    color: Colors.danger,
    marginTop: SPACING.sm,
    fontSize: 13,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: Colors.peach,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: SPACING.xl,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  customerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EAF0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  customerMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  editButton: {
    padding: 4,
  },
});
