import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Scheme } from '../types';

type Filter = 'ALL' | 'CENTRAL' | 'STATE';

export default function SchemesScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getSchemes()
      .then(setSchemes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = schemes.filter((s) => {
    if (filter !== 'ALL' && s.type !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'CENTRAL', label: t('centralScheme') },
    { id: 'STATE', label: t('stateScheme') },
  ];

  function handleKnowMore(scheme: Scheme) {
    Alert.alert(
      scheme.name,
      [
        scheme.description ?? '',
        scheme.eligibility ? `Eligibility: ${scheme.eligibility}` : '',
        scheme.benefit ? `Benefit: ${scheme.benefit}` : '',
        scheme.deadline ? `Deadline: ${scheme.deadline}` : '',
      ].filter(Boolean).join('\n\n') || 'No additional information available.',
      [{ text: 'Close' }],
    );
  }

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
        <Text style={styles.headerTitle}>{t('availableSchemes')}</Text>
        <TextInput
          style={styles.search}
          placeholder="Search schemes…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.countText}>{filtered.length} schemes</Text>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>{t('noSchemes')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.schemeCard, item.status === 'Closed' && styles.schemeCardClosed]}>
              <View style={styles.cardTop}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.schemeName} numberOfLines={2}>{item.name}</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.typeBadge, item.type === 'CENTRAL' ? styles.centralBadge : styles.stateBadge]}>
                    <Text style={[styles.typeBadgeText, item.type === 'CENTRAL' ? styles.centralText : styles.stateText]}>
                      {item.type === 'CENTRAL' ? t('centralScheme') : t('stateScheme')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'Active' ? styles.activeBadge : styles.closedBadge]}>
                    <Text style={[styles.statusText, item.status === 'Active' ? styles.activeText : styles.closedText]}>
                      {item.status === 'Active' ? t('active') : t('closed')}
                    </Text>
                  </View>
                </View>
              </View>

              {item.description && (
                <Text style={styles.schemeDesc} numberOfLines={3}>{item.description}</Text>
              )}

              <View style={styles.metaRow}>
                {item.benefit && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>💰</Text>
                    <Text style={styles.metaText} numberOfLines={1}>{item.benefit}</Text>
                  </View>
                )}
                {item.deadline && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>📅</Text>
                    <Text style={styles.metaText}>{item.deadline}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.knowMoreBtn} onPress={() => handleKnowMore(item)}>
                  <Text style={styles.knowMoreText}>{t('knowMore')}</Text>
                </TouchableOpacity>
                {item.status === 'Active' && (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => Alert.alert('Apply', 'Application portal coming soon. Visit your nearest agriculture office.')}
                  >
                    <Text style={styles.applyText}>Apply Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FONT_SIZE.base, color: COLORS.textMuted },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, ...SHADOW.sm },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  search: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: FONT_SIZE.base, color: COLORS.text, marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  countText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginLeft: 'auto' },
  list: { padding: 16, gap: 14 },
  schemeCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    ...SHADOW.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  schemeCardClosed: { opacity: 0.7 },
  cardTop: { marginBottom: 10 },
  nameBadgeRow: { marginBottom: 8 },
  schemeName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  centralBadge: { backgroundColor: COLORS.infoLight },
  stateBadge: { backgroundColor: COLORS.secondaryLight },
  typeBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  centralText: { color: COLORS.info },
  stateText: { color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  activeBadge: { backgroundColor: COLORS.secondaryLight },
  closedBadge: { backgroundColor: COLORS.border },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  activeText: { color: COLORS.secondary },
  closedText: { color: COLORS.textMuted },
  schemeDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: 10 },
  knowMoreBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center',
  },
  knowMoreText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  applyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  applyText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.white },
});
