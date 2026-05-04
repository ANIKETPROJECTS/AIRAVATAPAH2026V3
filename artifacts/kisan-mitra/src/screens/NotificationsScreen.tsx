import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Notification } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function notifIcon(type: string): string {
  switch (type) {
    case 'approval': return '✅';
    case 'rejection': return '❌';
    case 'scheme': return '📋';
    case 'subsidy': return '💰';
    case 'insurance': return '🛡️';
    default: return '🔔';
  }
}

function notifColor(type: string): string {
  switch (type) {
    case 'approval': return COLORS.secondary;
    case 'rejection': return COLORS.error;
    default: return COLORS.info;
  }
}

export default function NotificationsScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!state.mobile) return;
    try {
      const data = await api.getNotifications(state.mobile);
      setNotifs(data);
    } catch { /* ignore */ }
  }, [state.mobile]);

  useEffect(() => {
    fetchNotifs().finally(() => setLoading(false));
  }, [fetchNotifs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifs();
    setRefreshing(false);
  }, [fetchNotifs]);

  async function markRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifs((prev) => prev.map((n) => n.notificationId === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    if (!state.mobile) return;
    try {
      await api.markAllRead(state.mobile);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('notifications')}</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <Text style={styles.markAllText}>{t('markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
          <Text style={styles.emptySub}>You'll receive updates when the admin takes action on your registration.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => !item.read && markRead(item.notificationId)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: notifColor(item.type) + '20' }]}>
                <Text style={styles.icon}>{notifIcon(item.type)}</Text>
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTopRow}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody} numberOfLines={3}>{item.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textSecondary },
  emptySub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  header: {
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 16,
    paddingBottom: 16, ...SHADOW.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text },
  unreadCount: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primary,
  },
  markAllText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  list: { padding: 16, gap: 10 },
  notifCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifCardUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, borderColor: COLORS.border },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 },
  notifBody: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
