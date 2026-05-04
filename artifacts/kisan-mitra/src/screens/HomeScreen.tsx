import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Notification } from '../types';

const QUICK_ACTIONS = [
  { key: 'applyScheme', icon: '📋' },
  { key: 'fileInsurance', icon: '🛡️' },
  { key: 'raiseGrievance', icon: '📢' },
  { key: 'checkSubsidy', icon: '💰' },
];

export default function HomeScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (state.mobile) {
      api.getNotifications(state.mobile)
        .then((n) => setRecentNotifs(n.slice(0, 3)))
        .catch(() => {});
    }
  }, [state.mobile]);

  const initials = (farmer?.name && farmer.name !== '—')
    ? farmer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  function handleQuickAction(key: string) {
    Alert.alert(t(key), 'This feature is coming soon. Please visit your nearest agriculture office or use the web portal for now.');
  }

  const greetName = farmer?.name && farmer.name !== '—' ? farmer.name.split(' ')[0] : '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{t('welcome')}{greetName ? `, ${greetName} 🙏` : ' 🙏'}</Text>
              <Text style={styles.greetingSub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{t('activeStatus')}</Text>
          </View>
          {farmer?.farmerId && (
            <Text style={styles.farmerIdText}>ID: {farmer.farmerId}</Text>
          )}
        </View>

        <View style={styles.farmCard}>
          <Text style={styles.sectionTitle}>{t('farmSummary')}</Text>
          <View style={styles.farmGrid}>
            <FarmStat icon="📐" label={t('totalLand')} value={farmer?.land ? `${farmer.land} ha` : t('na')} />
            <FarmStat icon="🌱" label={t('primaryCrop')} value={(farmer?.crop && farmer.crop !== '—') ? farmer.crop : t('na')} />
            <FarmStat icon="🏘️" label={t('location')} value={(farmer?.village && farmer.village !== '—') ? farmer.village : t('na')} />
            <FarmStat icon="🗺️" label={t('district')} value={(farmer?.district && farmer.district !== '—') ? farmer.district : t('na')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={styles.actionBtn}
                onPress={() => handleQuickAction(a.key)}
              >
                <Text style={styles.actionIcon}>{a.icon}</Text>
                <Text style={styles.actionLabel}>{t(a.key)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {recentNotifs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recentNotifs')}</Text>
            <View style={styles.notifList}>
              {recentNotifs.map((n) => (
                <View key={n.notificationId} style={[styles.notifRow, !n.read && styles.notifRowUnread]}>
                  <Text style={styles.notifIcon}>
                    {n.type === 'approval' ? '✅' : n.type === 'rejection' ? '❌' : '🔔'}
                  </Text>
                  <View style={styles.notifInfo}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.advisoryCard}>
          <Text style={styles.advisoryIcon}>🌤️</Text>
          <View style={styles.advisoryInfo}>
            <Text style={styles.advisoryTitle}>Weather Advisory</Text>
            <Text style={styles.advisoryText}>Good conditions for sowing this week. Moderate rainfall expected in your district.</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FarmStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={farmStyles.stat}>
      <Text style={farmStyles.icon}>{icon}</Text>
      <Text style={farmStyles.label}>{label}</Text>
      <Text style={farmStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const farmStyles = StyleSheet.create({
  stat: {
    width: '48%', backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center', gap: 4,
  },
  icon: { fontSize: 24 },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center' },
  value: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  heroCard: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 16, ...SHADOW.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greeting: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.white },
  greetingSub: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.white },
  statusPill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 6,
  },
  statusPillText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  farmerIdText: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.xs },
  farmCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 16, ...SHADOW.sm,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  farmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '48%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center', gap: 8, ...SHADOW.sm,
  },
  actionIcon: { fontSize: 30 },
  actionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  notifList: { gap: 10 },
  notifRow: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOW.sm,
  },
  notifRowUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIcon: { fontSize: 22 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  notifBody: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
  advisoryCard: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8,
  },
  advisoryIcon: { fontSize: 32 },
  advisoryInfo: { flex: 1 },
  advisoryTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.info, marginBottom: 4 },
  advisoryText: { fontSize: FONT_SIZE.sm, color: '#1E3A5F', lineHeight: 18 },
});
