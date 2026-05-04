import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

const STEPS = [
  { key: 'submitted', icon: '📤' },
  { key: 'underReview', icon: '🔍' },
  { key: 'decision', icon: '✅' },
];

export default function PendingScreen() {
  const { state, refreshFarmer, logout } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [refreshing, setRefreshing] = useState(false);
  const farmer = state.farmer;

  useEffect(() => {
    const interval = setInterval(async () => {
      try { await refreshFarmer(); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshFarmer]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshFarmer();
    } catch {
      Alert.alert('Error', 'Could not fetch updated status. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  }

  const docs = farmer?.docs ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.statusIcon}>
            <Text style={styles.statusEmoji}>⏳</Text>
          </View>
          <Text style={styles.title}>{t('pendingTitle')}</Text>
          <Text style={styles.subtitle}>{t('pendingSubtitle')}</Text>
        </View>

        {farmer?.farmerId && (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>{t('farmerId')}</Text>
            <Text style={styles.idValue}>{farmer.farmerId}</Text>
            <Text style={styles.idMobile}>Mobile: +91 {state.mobile}</Text>
          </View>
        )}

        <View style={styles.timelineCard}>
          {STEPS.map((step, idx) => {
            const isActive = idx === 1;
            const isDone = idx === 0;
            return (
              <View key={step.key}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                    <Text style={styles.stepDotIcon}>{step.icon}</Text>
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepLabel, (isDone || isActive) && styles.stepLabelActive]}>
                      {step.key === 'submitted' ? t('statusSubmitted')
                        : step.key === 'underReview' ? t('statusUnderReview')
                        : t('statusDecision')}
                    </Text>
                    {isActive && <Text style={styles.stepSub}>Your documents are being reviewed</Text>}
                    {isDone && <Text style={styles.stepSub}>Documents received successfully</Text>}
                  </View>
                  {(isDone || isActive) && (
                    <View style={[styles.stepBadge, isDone ? styles.stepBadgeDone : styles.stepBadgeActive]}>
                      <Text style={styles.stepBadgeText}>{isDone ? '✓' : '●'}</Text>
                    </View>
                  )}
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                )}
              </View>
            );
          })}
        </View>

        {docs.length > 0 && (
          <View style={styles.docsCard}>
            <Text style={styles.docsTitle}>{t('docsSubmitted')}</Text>
            {docs.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <Text style={styles.docIcon}>📄</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docDate}>
                    {doc.extractedAt ? new Date(doc.extractedAt).toLocaleDateString('en-IN') : '—'}
                  </Text>
                </View>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>✓ Uploaded</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>⏰ What happens next?</Text>
          <Text style={styles.infoText}>
            The agriculture officer will review your uploaded documents and verify your land records. This typically takes 2-5 working days. You will be notified once a decision is made.
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.refreshBtnText}>🔄 {t('refreshStatus')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  statusIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.warningLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW.md,
  },
  statusEmoji: { fontSize: 48 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  idCard: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary, ...SHADOW.sm,
  },
  idLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  idValue: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 2 },
  idMobile: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  timelineCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 20, ...SHADOW.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepDot: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: COLORS.secondaryLight },
  stepDotActive: { backgroundColor: COLORS.warningLight },
  stepDotIcon: { fontSize: 22 },
  stepInfo: { flex: 1, paddingTop: 4 },
  stepLabel: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textMuted },
  stepLabelActive: { color: COLORS.text },
  stepSub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  stepBadgeDone: { backgroundColor: COLORS.secondary },
  stepBadgeActive: { backgroundColor: COLORS.warning },
  stepBadgeText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  stepLine: { width: 2, height: 28, backgroundColor: COLORS.border, marginLeft: 21, marginVertical: 4 },
  stepLineDone: { backgroundColor: COLORS.secondary },
  docsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 20, ...SHADOW.sm, gap: 12,
  },
  docsTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { fontSize: 22 },
  docInfo: { flex: 1 },
  docName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  docDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  docBadge: {
    backgroundColor: COLORS.secondaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  docBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.secondary },
  infoBox: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md, padding: 16,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.info,
  },
  infoTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.info, marginBottom: 8 },
  infoText: { fontSize: FONT_SIZE.sm, color: '#1E3A5F', lineHeight: 20 },
  refreshBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: COLORS.primary, ...SHADOW.sm,
  },
  refreshBtnText: { color: COLORS.primary, fontSize: FONT_SIZE.base, fontWeight: '700' },
  logoutBtn: { paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { color: COLORS.error, fontSize: FONT_SIZE.base, fontWeight: '600' },
});
