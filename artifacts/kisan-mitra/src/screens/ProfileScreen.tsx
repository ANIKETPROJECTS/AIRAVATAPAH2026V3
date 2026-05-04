import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

function InfoRow({ label, value }: { label: string; value?: string }) {
  const v = value && value !== '—' ? value : '—';
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>{v}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, flex: 1 },
  value: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text, flex: 1.5, textAlign: 'right' },
});

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <Text style={cardStyles.cardIcon}>{icon}</Text>
        <Text style={cardStyles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: COLORS.primaryBg },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
});

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;

  const initials = (farmer?.name && farmer.name !== '—')
    ? farmer.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  async function handleLogout() {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.farmerName}>{(farmer?.name && farmer.name !== '—') ? farmer.name : 'Farmer'}</Text>
          <Text style={styles.farmerMobile}>+91 {state.mobile}</Text>
          {farmer?.farmerId && (
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>🪪 {farmer.farmerId}</Text>
            </View>
          )}
          <View style={styles.kycBadge}>
            <Text style={styles.kycBadgeText}>✓ {t('kycVerified')}</Text>
          </View>
        </View>

        <SectionCard title={t('personalInfo')} icon="👤">
          <InfoRow label={t('name')} value={farmer?.name} />
          <InfoRow label={t('aadhaar')} value={farmer?.aadhaar} />
          <InfoRow label={t('dob')} value={(farmer as any)?.dob} />
          <InfoRow label={t('gender')} value={(farmer as any)?.gender} />
          <InfoRow label={t('mobile')} value={state.mobile ? `+91 ${state.mobile}` : undefined} />
        </SectionCard>

        <SectionCard title={t('landInfo')} icon="🌾">
          <InfoRow label={t('village')} value={farmer?.village} />
          <InfoRow label={t('district')} value={farmer?.district} />
          <InfoRow label={t('taluka')} value={farmer?.taluka} />
          <InfoRow label={t('surveyNo')} value={farmer?.surveyNumber} />
          <InfoRow label={t('landArea')} value={farmer?.land ? `${farmer.land} ha` : undefined} />
          <InfoRow label={t('crop')} value={farmer?.crop} />
        </SectionCard>

        <SectionCard title={t('bankInfo')} icon="🏦">
          <InfoRow label={t('bank')} value={farmer?.bankName} />
          <InfoRow label={t('branch')} value={(farmer as any)?.branchName} />
          <InfoRow label={t('ifsc')} value={(farmer as any)?.ifsc} />
          <InfoRow label={t('accountNo')} value={farmer?.bankAccount} />
        </SectionCard>

        {farmer?.docs && farmer.docs.length > 0 && (
          <SectionCard title="Documents" icon="📁">
            {farmer.docs.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <Text style={styles.docIcon}>📄</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docDate}>
                    {doc.extractedAt ? new Date(doc.extractedAt).toLocaleDateString('en-IN') : ''}
                  </Text>
                </View>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>✓</Text>
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Kisan Mitra — Govt. of Maharashtra</Text>
          <Text style={styles.footerText}>Agriculture & Farmers Welfare Dept.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  profileHero: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 24,
    alignItems: 'center', marginBottom: 16, ...SHADOW.md,
  },
  avatarLarge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...SHADOW.sm,
  },
  avatarText: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.white },
  farmerName: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  farmerMobile: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, marginBottom: 10 },
  idBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  idBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  kycBadge: {
    backgroundColor: COLORS.secondaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  kycBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.secondary },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  docIcon: { fontSize: 22 },
  docInfo: { flex: 1 },
  docName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  docDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  docBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  docBadgeText: { fontSize: FONT_SIZE.sm, color: COLORS.secondary, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingVertical: 16,
    alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.error,
    ...SHADOW.sm,
  },
  logoutText: { color: COLORS.error, fontSize: FONT_SIZE.base, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 4 },
  footerText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
