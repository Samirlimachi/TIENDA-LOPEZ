import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getProducts } from '@services/catalog';
import { createSale, SaleItemInput } from '@services/sales';
import { createCustomer, getCustomers } from '@services/customers';
import { API_BASE_URL } from '@constants/api';
import { Customer, PaymentMethod, Product } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { useCart } from '@context/CartContext';

const priceOf = (product: Product, priceType: 'price' | 'price2') =>
  priceType === 'price' ? product.price : product.price2;

export const NewSaleScreen = ({ navigation }: any) => {
  const { items: cart, addItem, removeItem, updateQuantity, setPriceType, clear, total } =
    useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCi, setCustomerCi] = useState('');
  const [customerNit, setCustomerNit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [amountReceived, setAmountReceived] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const receivedNumber = parseFloat(amountReceived) || 0;
  const change = paymentMethod === 'efectivo' ? receivedNumber - total : 0;

  useEffect(() => {
    getProducts().then(setProducts);
    getCustomers().then(setCustomers);
  }, []);

  const customerSuggestions = useMemo(() => {
    const query = customerName.trim().toLowerCase();
    if (!query || selectedCustomerId !== null) {
      return [];
    }
    return customers
      .filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          (c.ci ?? '').toLowerCase().includes(query) ||
          (c.nit ?? '').toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [customers, customerName, selectedCustomerId]);

  const handleChangeCustomerName = (text: string) => {
    setCustomerName(text);
    setSelectedCustomerId(null);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerCi(customer.ci ?? '');
    setCustomerNit(customer.nit ?? '');
  };

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return products
      .filter(
        p =>
          p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [products, search]);

  const addToCart = (product: Product) => {
    addItem(product);
    setSearch('');
  };

  const removeFromCart = removeItem;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (!customerName.trim()) {
      setError('Seleccioná o agregá un cliente');
      return;
    }
    if (paymentMethod === 'efectivo' && receivedNumber < total) {
      setError('El monto recibido es menor al total');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let customerId = selectedCustomerId;
      if (customerId === null) {
        const created = await createCustomer(
          customerName.trim(),
          customerCi.trim() || null,
          customerNit.trim() || null,
        );
        setCustomers(prev => [...prev, created]);
        customerId = created.id;
      }
      const items: SaleItemInput[] = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_type: item.priceType,
      }));
      await createSale({
        items,
        customer_id: customerId,
        customer_name: customerName.trim(),
        customer_ci: customerCi.trim() || null,
        customer_nit: customerNit.trim() || null,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'efectivo' ? receivedNumber : total,
      });
      clear();
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'No se pudo registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva venta</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() =>
            navigation.navigate('BarcodeScanner', {
              onScanned: (code: string) => {
                const match = products.find(p => p.code === code);
                if (match && match.stock > 0) {
                  addToCart(match);
                } else {
                  setSearch(code);
                }
              },
            })
          }
        >
          <Icon name="barcode-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Icon name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto por nombre o código..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
            <Icon name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {searchResults.length > 0 && (
        <FlatList
          style={styles.resultsList}
          data={searchResults}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultRow, item.stock <= 0 && styles.resultRowDisabled]}
              onPress={() => addToCart(item)}
              disabled={item.stock <= 0}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultCode}>
                  {item.code} · Stock: {item.stock}
                </Text>
              </View>
              <Icon
                name={item.stock <= 0 ? 'ban-outline' : 'add-circle'}
                size={24}
                color={item.stock <= 0 ? Colors.textMuted : Colors.primary}
              />
            </TouchableOpacity>
          )}
        />
      )}

      <ScrollView contentContainerStyle={styles.cartContent}>
        <View style={styles.cartHeader}>
          <Icon name="cart" size={16} color={Colors.primary} />
          <Text style={styles.cartTitle}>Carrito</Text>
          {cart.length > 0 && <Text style={styles.cartCount}>{cart.length}</Text>}
        </View>

        {cart.length === 0 ? (
          <Text style={styles.emptyCart}>Buscá un producto arriba para agregarlo</Text>
        ) : (
          cart.map(item => {
            const hasBothPrices = item.product.price !== null && item.product.price2 !== null;
            const price = priceOf(item.product, item.priceType);
            const subtotal = price ? Number(price) * item.quantity : 0;
            return (
              <View key={item.product.id} style={[styles.cartItem, Shadows.card]}>
                <View style={styles.cartItemRow}>
                  {item.product.images.length > 0 ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${item.product.images[0].url}` }}
                      style={styles.cartItemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cartItemImage, styles.cartItemImagePlaceholder]}>
                      <Icon name="image-outline" size={20} color={Colors.textMuted} />
                    </View>
                  )}

                  <View style={styles.cartItemMain}>
                    <View style={styles.cartItemHeader}>
                      <Text style={styles.cartItemName} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeFromCart(item.product.id)}
                        hitSlop={8}
                      >
                        <Icon name="trash-outline" size={18} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemCode}>{item.product.code}</Text>
                  </View>
                </View>

                {hasBothPrices && (
                  <View style={styles.priceTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.priceTypeChip,
                        item.priceType === 'price' && styles.priceTypeChipActive,
                      ]}
                      onPress={() => setPriceType(item.product.id, 'price')}
                    >
                      <Text
                        style={[
                          styles.priceTypeText,
                          item.priceType === 'price' && styles.priceTypeTextActive,
                        ]}
                      >
                        Mayorista Bs. {item.product.price}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.priceTypeChip,
                        item.priceType === 'price2' && styles.priceTypeChipActive,
                      ]}
                      onPress={() => setPriceType(item.product.id, 'price2')}
                    >
                      <Text
                        style={[
                          styles.priceTypeText,
                          item.priceType === 'price2' && styles.priceTypeTextActive,
                        ]}
                      >
                        Por unidad Bs. {item.product.price2}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.cartItemFooter}>
                  <View style={styles.quantityStepper}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateQuantity(item.product.id, -1)}
                    >
                      <Icon name="remove" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateQuantity(item.product.id, 1)}
                    >
                      <Icon name="add" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemSubtotal}>Bs. {subtotal.toFixed(2)}</Text>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.customerHeader}>
          <Icon name="receipt" size={16} color={Colors.primary} />
          <Text style={styles.cartTitle}>Datos de la venta</Text>
        </View>

        <View style={[styles.customerCard, Shadows.card]}>
          <View style={styles.customerFieldHeader}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <TouchableOpacity
              style={styles.newCustomerLink}
              onPress={() =>
                navigation.navigate('Customers', { onSave: handleSelectCustomer })
              }
            >
              <Icon name="person-add-outline" size={13} color={Colors.secondary} />
              <Text style={styles.newCustomerLinkText}>Registrar cliente</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.fieldInput}
            placeholder="Nombre del cliente"
            placeholderTextColor={Colors.textMuted}
            value={customerName}
            onChangeText={handleChangeCustomerName}
          />
          {customerSuggestions.length > 0 && (
            <View style={styles.suggestionsList}>
              {customerSuggestions.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectCustomer(c)}
                >
                  <Text style={styles.suggestionName}>{c.name}</Text>
                  {(c.ci || c.nit) && (
                    <Text style={styles.suggestionMeta}>
                      {c.ci ? `CI ${c.ci}` : ''}
                      {c.ci && c.nit ? ' · ' : ''}
                      {c.nit ? `NIT ${c.nit}` : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedCustomerId !== null && (
            <View style={styles.selectedCustomerBadge}>
              <Icon name="checkmark-circle" size={13} color={Colors.primary} />
              <Text style={styles.selectedCustomerText}>Cliente existente seleccionado</Text>
            </View>
          )}

          <View style={styles.idRow}>
            <View style={styles.idField}>
              <Text style={styles.fieldLabel}>CI (opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ej: 1234567"
                placeholderTextColor={Colors.textMuted}
                value={customerCi}
                onChangeText={setCustomerCi}
              />
            </View>
            <View style={styles.idField}>
              <Text style={styles.fieldLabel}>NIT (opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ej: 1234567890"
                placeholderTextColor={Colors.textMuted}
                value={customerNit}
                onChangeText={setCustomerNit}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Tipo de pago</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[
                styles.paymentChip,
                paymentMethod === 'efectivo' && styles.paymentChipActive,
              ]}
              onPress={() => setPaymentMethod('efectivo')}
            >
              <Icon
                name="cash-outline"
                size={16}
                color={paymentMethod === 'efectivo' ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.paymentChipText,
                  paymentMethod === 'efectivo' && styles.paymentChipTextActive,
                ]}
              >
                Efectivo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentChip, paymentMethod === 'qr' && styles.paymentChipActive]}
              onPress={() => setPaymentMethod('qr')}
            >
              <Icon
                name="qr-code-outline"
                size={16}
                color={paymentMethod === 'qr' ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.paymentChipText,
                  paymentMethod === 'qr' && styles.paymentChipTextActive,
                ]}
              >
                QR
              </Text>
            </TouchableOpacity>
          </View>

          {paymentMethod === 'efectivo' && (
            <>
              <Text style={styles.fieldLabel}>Monto recibido (Bs.)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                value={amountReceived}
                onChangeText={setAmountReceived}
              />
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Cambio a entregar</Text>
                <Text
                  style={[styles.changeValue, change < 0 && styles.changeValueNegative]}
                >
                  Bs. {change.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Bs. {total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, (submitting || cart.length === 0) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || cart.length === 0}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Guardando...' : 'Registrar venta'}
          </Text>
        </TouchableOpacity>
      </View>
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
  scanButton: {
    width: 72,
    alignItems: 'flex-end',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.peach,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  resultsList: {
    maxHeight: 220,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultRowDisabled: {
    opacity: 0.5,
  },
  resultInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  resultName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  resultCode: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cartContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  cartTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
    flex: 1,
  },
  cartCount: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  emptyCart: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  cartItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
  },
  cartItemRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cartItemImage: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  cartItemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemMain: {
    flex: 1,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  cartItemName: {
    flex: 1,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  cartItemCode: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  priceTypeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  priceTypeChip: {
    flex: 1,
    paddingVertical: 6,
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
    fontSize: 11,
    color: Colors.textMuted,
  },
  priceTypeTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  customerFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newCustomerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newCustomerLinkText: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '600',
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
  suggestionsList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: SPACING.xs,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  selectedCustomerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  selectedCustomerText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  idRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  idField: {
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF0FA',
  },
  paymentChipText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  paymentChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  changeLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  changeValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 18,
  },
  changeValueNegative: {
    color: Colors.danger,
  },
  error: {
    color: Colors.danger,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
