import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { getBrands, getCategories, getProducts, getTematicas } from '@services/catalog';
import { API_BASE_URL } from '@constants/api';
import { Brand, Category, Product, Tematica } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { useResponsive } from '@hooks/useLayout';
import { Dropdown } from '@components/forms/Dropdown';
import { ImageViewerModal } from '@components/ImageViewerModal';
import { ProductQuickAddModal } from '@components/ProductQuickAddModal';
import { HeaderMenu } from '@components/HeaderMenu';

export const CatalogScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const { gridColumns } = useResponsive();
  const { items: cartItems } = useCart();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === 'admin';
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tematicas, setTematicas] = useState<Tematica[]>([]);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedTematica, setSelectedTematica] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilters = useCallback(async () => {
    try {
      const [categoriesData, brandsData, tematicasData] = await Promise.all([
        getCategories(),
        getBrands(),
        getTematicas(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
      setTematicas(tematicasData);
    } catch {
      setError('No se pudieron cargar los filtros');
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError('No se pudieron cargar los productos');
    }
  }, []);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProducts().finally(() => setLoading(false));
    }, [loadProducts]),
  );

  useEffect(() => {
    if (!addedToast) {
      return;
    }
    const timeout = setTimeout(() => setAddedToast(null), 1400);
    return () => clearTimeout(timeout);
  }, [addedToast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProducts(), loadFilters()]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedTematica(null);
  };

  const filteredProducts = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return products.filter(product => {
      if (
        searchLower &&
        !product.name.toLowerCase().includes(searchLower) &&
        !product.code.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
      if (selectedCategory !== null && product.category_id !== selectedCategory) {
        return false;
      }
      if (selectedBrand !== null && product.brand_id !== selectedBrand) {
        return false;
      }
      if (selectedTematica !== null && product.tematica_id !== selectedTematica) {
        return false;
      }
      return true;
    });
  }, [products, search, selectedCategory, selectedBrand, selectedTematica]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    const category = categories.find(c => c.id === selectedCategory);
    if (category) {
      chips.push({
        key: 'category',
        label: category.name,
        onClear: () => setSelectedCategory(null),
      });
    }
    const brand = brands.find(b => b.id === selectedBrand);
    if (brand) {
      chips.push({ key: 'brand', label: brand.name, onClear: () => setSelectedBrand(null) });
    }
    const tematica = tematicas.find(t => t.id === selectedTematica);
    if (tematica) {
      chips.push({
        key: 'tematica',
        label: tematica.name,
        onClear: () => setSelectedTematica(null),
      });
    }
    return chips;
  }, [categories, brands, tematicas, selectedCategory, selectedBrand, selectedTematica]);

  const handleCardPress = (item: Product) => {
    if (isAdmin) {
      navigation.navigate('ProductForm', { product: item });
      return;
    }
    if (item.stock <= 0) {
      return;
    }
    setQuickAddProduct(item);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.card, Shadows.card]}
      activeOpacity={0.7}
      onPress={() => handleCardPress(item)}
      disabled={!isAdmin && item.stock <= 0}
    >
      {!isAdmin && item.stock > 0 && (
        <View style={styles.addToCartHint}>
          <Icon name="add-circle" size={24} color={Colors.secondary} />
        </View>
      )}
      {item.images.length > 0 ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setViewerImages(item.images.map(img => img.url))}
        >
          <Image
            source={{ uri: `${API_BASE_URL}${item.images[0].url}` }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {item.images.length > 1 && (
            <View style={styles.cardImageBadge}>
              <Icon name="images" size={11} color={Colors.white} />
              <Text style={styles.cardImageBadgeText}>{item.images.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <View style={styles.cardImagePlaceholderIcon}>
            <Icon name="image-outline" size={22} color={Colors.textMuted} />
          </View>
          <Text style={styles.cardImagePlaceholderText}>Sin foto</Text>
        </View>
      )}
      <Text style={styles.cardCategory}>
        {item.category_name}
        {item.tematica_name ? ` · ${item.tematica_name}` : ''}
      </Text>
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.cardCode} numberOfLines={1} ellipsizeMode="tail">
        {item.code}
      </Text>
      {item.brand_name ? <Text style={styles.cardBrand}>{item.brand_name}</Text> : null}
      {item.price && (
        <View style={styles.cardPrices}>
          <Text style={styles.cardPrice}>Bs. {item.price}</Text>
          <Text style={styles.cardPriceLabel}>Mayorista</Text>
        </View>
      )}
      {item.price2 && (
        <View style={styles.cardPrices}>
          <Text style={styles.cardPriceSecondary}>Bs. {item.price2}</Text>
          <Text style={styles.cardPriceLabel}>Por unidad</Text>
        </View>
      )}
      <Text style={[styles.cardStock, item.stock <= 0 && styles.cardStockEmpty]}>
        {item.stock > 0 ? `Stock: ${item.stock}` : 'Sin stock'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tienda Lopez</Text>
          <Text style={styles.headerSubtitle}>
            {user?.username} · {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('BarcodeScanner', {
                onScanned: (code: string) => {
                  setSearch(code);
                  const match = products.find(p => p.code === code);
                  if (match) {
                    handleCardPress(match);
                  }
                },
              })
            }
            hitSlop={10}
            style={styles.scanButton}
          >
            <Icon name="barcode-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <HeaderMenu
            items={[
            ...(isAdmin
              ? [
                  {
                    icon: 'pricetags-outline',
                    label: 'Catálogo',
                    onPress: () => navigation.navigate('ManageCatalog'),
                  },
                  {
                    icon: 'people-outline',
                    label: 'Usuarios',
                    onPress: () => navigation.navigate('Users'),
                  },
                  {
                    icon: 'bar-chart-outline',
                    label: 'Reportes',
                    onPress: () => navigation.navigate('Reports'),
                  },
                ]
              : []),
            {
              icon: 'receipt-outline',
              label: 'Ventas',
              onPress: () => navigation.navigate('SalesHistory'),
            },
            {
              icon: 'log-out-outline',
              label: 'Salir',
              onPress: logout,
              destructive: true,
            },
          ]}
          />
        </View>
      </View>

      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Icon
          name="search"
          size={18}
          color={searchFocused ? Colors.primary : Colors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o código..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
            <Icon name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        <Dropdown
          label="Categoría"
          icon="pricetag-outline"
          items={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <Dropdown
          label="Marca"
          icon="ribbon-outline"
          items={brands}
          selectedId={selectedBrand}
          onSelect={setSelectedBrand}
        />
        <Dropdown
          label="Temática"
          icon="color-palette-outline"
          items={tematicas}
          selectedId={selectedTematica}
          onSelect={setSelectedTematica}
        />
      </View>

      {activeFilterChips.length > 0 && (
        <View style={styles.activeChipsRow}>
          {activeFilterChips.map(chip => (
            <TouchableOpacity key={chip.key} style={styles.activeChip} onPress={chip.onClear}>
              <Text style={styles.activeChipText}>{chip.label}</Text>
              <Icon name="close" size={13} color={Colors.white} />
            </TouchableOpacity>
          ))}
          {activeFilterChips.length > 1 && (
            <TouchableOpacity style={styles.clearAllChip} onPress={clearFilters}>
              <Text style={styles.clearAllChipText}>Limpiar todo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.resultsCount}>
        {filteredProducts.length}{' '}
        {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={filteredProducts}
          key={gridColumns}
          numColumns={gridColumns}
          keyExtractor={item => String(item.id)}
          renderItem={renderProduct}
          columnWrapperStyle={gridColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay productos que coincidan con la búsqueda</Text>
          }
        />
      )}

      {addedToast && (
        <View style={[styles.toast, { bottom: SPACING.lg + 64 + insets.bottom }]}>
          <Icon name="checkmark-circle" size={16} color={Colors.white} />
          <Text style={styles.toastText} numberOfLines={1}>
            Agregado: {addedToast}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          styles.fabSale,
          isAdmin && styles.fabSaleWithAdmin,
          { bottom: SPACING.lg + insets.bottom },
        ]}
        onPress={() => navigation.navigate('NewSale')}
      >
        <Icon name="cart" size={22} color={Colors.white} />
        {cartItems.length > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{cartItems.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { bottom: SPACING.lg + insets.bottom }]}
          onPress={() => navigation.navigate('ProductForm', { product: null })}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <ImageViewerModal
        visible={viewerImages !== null}
        images={viewerImages ?? []}
        onClose={() => setViewerImages(null)}
      />

      <ProductQuickAddModal
        product={quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        onAdded={added => setAddedToast(added.name)}
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
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.primary,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.peach,
  },
  searchBarFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  activeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  activeChipText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllChip: {
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  clearAllChipText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resultsCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 100,
  },
  row: {
    gap: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  addToCartHint: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    ...Shadows.card,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    marginBottom: SPACING.sm,
    backgroundColor: Colors.surface,
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  cardImagePlaceholderIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  cardImageBadge: {
    position: 'absolute',
    right: SPACING.xs,
    bottom: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 43, 73, 0.75)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardImageBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardCategory: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: SPACING.xs,
  },
  cardCode: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
  },
  cardBrand: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
  },
  cardPrices: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
  },
  cardPriceSecondary: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  cardPriceLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardStock: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
  cardStockEmpty: {
    color: Colors.danger,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: SPACING.xl,
  },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  fabSale: {
    backgroundColor: Colors.secondary,
  },
  fabSaleWithAdmin: {
    right: SPACING.lg + 64,
  },
  fabText: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 30,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg + 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...Shadows.card,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
