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
import { approveUser, getUsers, setUserActive, setUserRole } from '@services/users';
import { ManagedUser } from '@models/index';
import { Colors, Typography, BorderRadius, Shadows } from '@theme/index';
import { SPACING } from '@constants/dimensions';
import { useConfirm } from '@context/ConfirmDialogContext';

export const UsersScreen = ({ navigation }: any) => {
  const confirm = useConfirm();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
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

  const handleApprove = async (user: ManagedUser) => {
    setBusyId(user.id);
    try {
      await approveUser(user.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (user: ManagedUser) => {
    setBusyId(user.id);
    try {
      await setUserActive(user.id, !user.is_active);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (user: ManagedUser, newRole: 'admin' | 'vendedor') => {
    const title = newRole === 'admin' ? 'Hacer administrador' : 'Quitar administrador';
    const message =
      newRole === 'admin'
        ? `¿Seguro que querés dar permisos de administrador a "${user.username}"?`
        : `¿Seguro que querés quitarle los permisos de administrador a "${user.username}"? Volverá a ser vendedor.`;

    const confirmed = await confirm({ title, message });
    if (!confirmed) {
      return;
    }

    setBusyId(user.id);
    try {
      await setUserRole(user.id, newRole);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const renderUser = ({ item }: { item: ManagedUser }) => (
    <View style={[styles.card, Shadows.card]}>
      <View style={styles.cardHeader}>
        <Text style={styles.username}>{item.username}</Text>
        {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
        <View style={styles.badges}>
          <View style={[styles.badge, styles.badgeRole]}>
            <Text style={styles.badgeText}>
              {item.role === 'admin' ? 'Administrador' : 'Vendedor'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              item.is_approved ? styles.badgeApproved : styles.badgePending,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.is_approved ? 'Aprobado' : 'Pendiente'}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              item.is_active ? styles.badgeActive : styles.badgeInactive,
            ]}
          >
            <Text style={styles.badgeText}>{item.is_active ? 'Activo' : 'Inactivo'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {item.role === 'vendedor' ? (
          <>
            {!item.is_approved && (
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(item)}
                disabled={busyId === item.id}
              >
                <Text style={styles.actionButtonText}>
                  {busyId === item.id ? '...' : 'Aprobar'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionButton,
                item.is_active ? styles.deactivateButton : styles.activateButton,
              ]}
              onPress={() => handleToggleActive(item)}
              disabled={busyId === item.id}
            >
              <Text style={styles.actionButtonText}>
                {busyId === item.id ? '...' : item.is_active ? 'Desactivar' : 'Activar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.roleButton]}
              onPress={() => handleChangeRole(item, 'admin')}
              disabled={busyId === item.id}
            >
              <Text style={styles.actionButtonText}>
                {busyId === item.id ? '...' : 'Hacer admin'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.roleButton]}
            onPress={() => handleChangeRole(item, 'vendedor')}
            disabled={busyId === item.id}
          >
            <Text style={styles.actionButtonText}>
              {busyId === item.id ? '...' : 'Quitar admin'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no hay otras cuentas registradas</Text>
          }
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
  },
  back: {
    color: Colors.primary,
    fontWeight: '600',
    width: 60,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  list: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    marginBottom: SPACING.sm,
  },
  username: {
    ...Typography.h3,
    color: Colors.text,
  },
  email: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: SPACING.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeRole: {
    backgroundColor: Colors.peach,
  },
  badgeApproved: {
    backgroundColor: '#DCEFDC',
  },
  badgePending: {
    backgroundColor: '#FCEBCB',
  },
  badgeActive: {
    backgroundColor: '#DCEFDC',
  },
  badgeInactive: {
    backgroundColor: '#F5D6D6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: SPACING.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: Colors.primary,
  },
  activateButton: {
    backgroundColor: Colors.success,
  },
  deactivateButton: {
    backgroundColor: Colors.danger,
  },
  roleButton: {
    backgroundColor: Colors.linen,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: SPACING.xl,
  },
});
