import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@context/AuthContext';
import { getSales } from '@services/sales';
import { Sale } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';

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

export const SalesHistoryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getSales();
    setSales(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={Colors.primary} />
          <Text style={styles.back}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isAdmin ? 'Ventas' : 'Mis ventas'}</Text>
        <View style={{ width: 72 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no hay ventas registradas</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, Shadows.card]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SaleDetail', { sale: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
                <Text style={styles.cardTotal}>Bs. {Number(item.total).toFixed(2)}</Text>
              </View>
              {isAdmin && (
                <Text style={styles.cardSeller}>Vendedor: {item.seller_username}</Text>
              )}
              <Text style={styles.cardCustomer}>Cliente: {item.customer_name}</Text>

              <View style={styles.paymentInfoRow}>
                <View style={styles.paymentBadge}>
                  <Icon
                    name={item.payment_method === 'qr' ? 'qr-code-outline' : 'cash-outline'}
                    size={13}
                    color={Colors.primary}
                  />
                  <Text style={styles.paymentBadgeText}>
                    {item.payment_method === 'qr' ? 'QR' : 'Efectivo'}
                  </Text>
                </View>
                <Text style={styles.itemCount}>
                  {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}
                </Text>
                <Icon name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
  loader: {
    marginTop: SPACING.xl,
  },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: SPACING.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDate: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  cardTotal: {
    ...Typography.h3,
    color: Colors.primary,
    fontSize: 16,
  },
  cardSeller: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  cardCustomer: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  paymentBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  itemCount: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
});
