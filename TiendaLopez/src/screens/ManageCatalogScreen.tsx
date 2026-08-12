import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  createBrand,
  createCategory,
  createTematica,
  getBrands,
  getCategories,
  getTematicas,
} from '@services/catalog';
import { Brand, Category, Tematica } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { TagPicker } from '@components/forms/TagPicker';

export const ManageCatalogScreen = ({ navigation }: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tematicas, setTematicas] = useState<Tematica[]>([]);

  const loadAll = useCallback(async () => {
    const [categoriesData, brandsData, tematicasData] = await Promise.all([
      getCategories(),
      getBrands(),
      getTematicas(),
    ]);
    setCategories(categoriesData);
    setBrands(brandsData);
    setTematicas(tematicasData);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateCategory = async (name: string) => {
    await createCategory(name);
    await loadAll();
  };

  const handleCreateBrand = async (name: string) => {
    await createBrand(name);
    await loadAll();
  };

  const handleCreateTematica = async (name: string) => {
    await createTematica(name);
    await loadAll();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Catálogo</Text>
          <Text style={styles.headerSubtitle}>Categorías, marcas y temáticas</Text>
        </View>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#EAF0FA' }]}>
              <Icon name="pricetag" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Categorías</Text>
            <Text style={styles.cardCount}>{categories.length}</Text>
          </View>
          <TagPicker
            label=""
            items={categories}
            selectedId={null}
            onSelect={() => {}}
            onCreate={handleCreateCategory}
          />
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FCEDEB' }]}>
              <Icon name="ribbon" size={16} color={Colors.secondary} />
            </View>
            <Text style={styles.cardTitle}>Marcas</Text>
            <Text style={styles.cardCount}>{brands.length}</Text>
          </View>
          <TagPicker
            label=""
            items={brands}
            selectedId={null}
            onSelect={() => {}}
            onCreate={handleCreateBrand}
          />
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#F2ECE3' }]}>
              <Icon name="color-palette" size={16} color={Colors.linen} />
            </View>
            <Text style={styles.cardTitle}>Temáticas</Text>
            <Text style={styles.cardCount}>{tematicas.length}</Text>
          </View>
          <TagPicker
            label=""
            items={tematicas}
            selectedId={null}
            onSelect={() => {}}
            onCreate={handleCreateTematica}
          />
        </View>
      </ScrollView>
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
  headerTitleWrapper: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.primary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  cardCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
