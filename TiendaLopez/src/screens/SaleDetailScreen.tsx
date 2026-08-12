import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNPrint from 'react-native-print';
import { Sale } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { buildReceiptHtml } from '@utils/receipt';

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SaleDetailScreen = ({ navigation, route }: any) => {
  const sale: Sale = route.params.sale;
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await RNPrint.print({ html: buildReceiptHtml(sale), jobName: `Venta-${sale.id}` });
    } catch {
      // El usuario canceló el diálogo de impresión u ocurrió un error del sistema.
    } finally {
      setPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de venta</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.row}>
            <Icon name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.rowText}>{formatDate(sale.created_at)}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="person-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.rowText}>Emitido por: {sale.seller_username}</Text>
          </View>
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="person-outline" size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Cliente</Text>
          </View>
          <Text style={styles.customerName}>{sale.customer_name}</Text>
          {(sale.customer_ci || sale.customer_nit) && (
            <Text style={styles.customerMeta}>
              {sale.customer_ci ? `CI ${sale.customer_ci}` : ''}
              {sale.customer_ci && sale.customer_nit ? ' · ' : ''}
              {sale.customer_nit ? `NIT ${sale.customer_nit}` : ''}
            </Text>
          )}
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="cart-outline" size={16} color={Colors.primary} />
            <Text style={styles.cardTitle}>Productos</Text>
            <Text style={styles.itemCountBadge}>{sale.items.length}</Text>
          </View>
          {sale.items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemCode}>
                  {item.product_code} · {item.quantity} x Bs. {Number(item.unit_price).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>Bs. {Number(item.subtotal).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardHeaderRow}>
            <Icon
              name={sale.payment_method === 'qr' ? 'qr-code-outline' : 'cash-outline'}
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.cardTitle}>Pago</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tipo de pago</Text>
            <Text style={styles.paymentValue}>
              {sale.payment_method === 'qr' ? 'QR' : 'Efectivo'}
            </Text>
          </View>
          {sale.payment_method === 'efectivo' && (
            <>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Monto recibido</Text>
                <Text style={styles.paymentValue}>
                  Bs. {Number(sale.amount_received).toFixed(2)}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Cambio entregado</Text>
                <Text style={styles.paymentValue}>
                  Bs. {Number(sale.change_given).toFixed(2)}
                </Text>
              </View>
            </>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Bs. {Number(sale.total).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.printButton, printing && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={printing}
        >
          <Icon name="print-outline" size={18} color={Colors.white} />
          <Text style={styles.printButtonText}>
            {printing ? 'Abriendo...' : 'Imprimir recibo'}
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
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  rowText: {
    color: Colors.text,
    fontSize: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 15,
    flex: 1,
  },
  itemCountBadge: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  customerName: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  customerMeta: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  itemCode: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtotal: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  paymentValue: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: SPACING.md,
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  printButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
