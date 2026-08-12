import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getSalesSummary, ReportPeriod, SalesSummary } from '@services/reports';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Todo' },
];

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  qr: 'QR',
};

export const ReportsScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: ReportPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalesSummary(p);
      setSummary(data);
    } catch {
      setError('No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
        <View style={{ width: 72 }} />
      </View>

      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.periodChip, period === option.value && styles.periodChipActive]}
            onPress={() => setPeriod(option.value)}
          >
            <Text
              style={[
                styles.periodChipText,
                period === option.value && styles.periodChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : summary ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, Shadows.card]}>
              <Icon name="cash-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>Bs. {summary.totalRevenue.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total vendido</Text>
            </View>
            <View style={[styles.statCard, Shadows.card]}>
              <Icon name="receipt-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{summary.totalSales}</Text>
              <Text style={styles.statLabel}>Ventas</Text>
            </View>
            <View style={[styles.statCard, Shadows.card]}>
              <Icon name="cube-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{summary.totalItemsSold}</Text>
              <Text style={styles.statLabel}>Productos vendidos</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Icon name="card-outline" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Por tipo de pago</Text>
          </View>
          {summary.byPaymentMethod.length === 0 ? (
            <Text style={styles.emptyText}>Sin ventas en este período</Text>
          ) : (
            <View style={[styles.card, Shadows.card]}>
              {summary.byPaymentMethod.map(row => (
                <View key={row.payment_method} style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>
                    {PAYMENT_METHOD_LABEL[row.payment_method] ?? row.payment_method} ·{' '}
                    {row.count} {row.count === 1 ? 'venta' : 'ventas'}
                  </Text>
                  <Text style={styles.paymentValue}>Bs. {Number(row.total).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Icon name="trophy-outline" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Productos más vendidos</Text>
          </View>
          {summary.topProducts.length === 0 ? (
            <Text style={styles.emptyText}>Sin ventas en este período</Text>
          ) : (
            <View style={[styles.card, Shadows.card]}>
              {summary.topProducts.map((product, index) => (
                <View key={product.product_id} style={styles.rankRow}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName} numberOfLines={1}>
                      {product.product_name}
                    </Text>
                    <Text style={styles.rankMeta}>
                      {product.product_code} · {product.quantity} unidades
                    </Text>
                  </View>
                  <Text style={styles.rankRevenue}>Bs. {Number(product.revenue).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Icon name="warning-outline" size={16} color={Colors.danger} />
            <Text style={styles.sectionTitle}>Stock bajo</Text>
          </View>
          {summary.lowStock.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos con poco stock</Text>
          ) : (
            <View style={[styles.card, Shadows.card]}>
              {summary.lowStock.map(product => (
                <View key={product.id} style={styles.lowStockRow}>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.rankMeta}>
                      {product.code} · {product.category_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.lowStockValue,
                      product.stock === 0 && styles.lowStockValueEmpty,
                    ]}
                  >
                    {product.stock === 0 ? 'Sin stock' : `${product.stock} u.`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
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
  periodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodChipTextActive: {
    color: Colors.white,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.danger,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 16,
    textAlign: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 15,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    paddingVertical: SPACING.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  paymentLabel: {
    color: Colors.text,
    fontSize: 13,
  },
  paymentValue: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankNumber: {
    width: 20,
    color: Colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  rankMeta: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  rankRevenue: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lowStockValue: {
    color: '#B36B00',
    fontWeight: '700',
    fontSize: 13,
  },
  lowStockValueEmpty: {
    color: Colors.danger,
  },
});
