import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Scheme, InsuranceSubsidy } from '../types';

type SchemeFilter = 'ALL' | 'CENTRAL' | 'STATE';
type Tab = 'schemes' | 'insurance' | 'subsidies';

function isEligibleScheme(scheme: Scheme, crop?: string, land?: string | number): boolean {
  if (!scheme.eligibility) return true;
  const e = scheme.eligibility.toLowerCase();
  if (crop && crop !== '—' && e.includes(crop.toLowerCase())) return true;
  if (land) {
    const acres = parseFloat(String(land));
    if (!isNaN(acres)) {
      const minMatch = e.match(/(\d+(\.\d+)?)\s*(ha|acre|hectare)/);
      if (minMatch) {
        const minVal = parseFloat(minMatch[1]);
        if (acres >= minVal) return true;
      }
    }
  }
  return false;
}

function isEligibleItem(item: InsuranceSubsidy, crop?: string, land?: string | number): boolean {
  const eligible = item.eligibility?.toLowerCase() ?? '';
  if (item.crops && item.crops.length > 0 && crop && crop !== '—') {
    if (item.crops.some((c) => c.toLowerCase().includes(crop.toLowerCase()) || crop.toLowerCase().includes(c.toLowerCase()))) return true;
  }
  if (crop && crop !== '—' && eligible.includes(crop.toLowerCase())) return true;
  if (land) {
    const acres = parseFloat(String(land));
    if (!isNaN(acres)) {
      if (item.minLand !== undefined && acres >= item.minLand) return true;
    }
  }
  return !item.crops || item.crops.length === 0;
}

export default function SchemesScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;
  const crop = farmer?.crop;
  const land = farmer?.land;

  const [tab, setTab] = useState<Tab>('schemes');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [insuranceItems, setInsuranceItems] = useState<InsuranceSubsidy[]>([]);
  const [subsidyItems, setSubsidyItems] = useState<InsuranceSubsidy[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SchemeFilter>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [schemesRes, insuranceRes, subsidyRes] = await Promise.all([
          api.getSchemes(),
          api.getInsuranceSubsidies({ type: 'Insurance', limit: 50 }),
          api.getInsuranceSubsidies({ type: 'Subsidy', limit: 50 }),
        ]);
        setSchemes(schemesRes);
        setInsuranceItems(insuranceRes.items);
        setSubsidyItems(subsidyRes.items);
      } catch {
        setSchemes([]);
        setInsuranceItems([]);
        setSubsidyItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredSchemes = schemes.filter((s) => {
    if (filter !== 'ALL' && s.type !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredInsurance = insuranceItems.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubsidies = subsidyItems.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const SCHEME_FILTERS: { id: SchemeFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'CENTRAL', label: t('centralScheme') },
    { id: 'STATE', label: t('stateScheme') },
  ];

  function handleKnowMore(name: string, description?: string, eligibility?: string, benefit?: string, deadline?: string) {
    Alert.alert(
      name,
      [
        description ?? '',
        eligibility ? `Eligibility: ${eligibility}` : '',
        benefit ? `Benefit: ${benefit}` : '',
        deadline ? `Deadline: ${deadline}` : '',
      ].filter(Boolean).join('\n\n') || 'No additional information available.',
      [{ text: 'Close' }],
    );
  }

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'schemes', label: state.lang === 'hi' ? 'योजनाएं' : state.lang === 'mr' ? 'योजना' : 'Schemes', count: schemes.length },
    { id: 'insurance', label: state.lang === 'hi' ? 'बीमा' : state.lang === 'mr' ? 'विमा' : 'Insurance', count: insuranceItems.length },
    { id: 'subsidies', label: state.lang === 'hi' ? 'सब्सिडी' : state.lang === 'mr' ? 'अनुदान' : 'Subsidies', count: subsidyItems.length },
  ];

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

        {crop && crop !== '—' && (
          <View style={styles.eligibilityBanner}>
            <Text style={styles.eligibilityText}>
              🌾 {state.lang === 'hi' ? `${crop} किसानों के लिए योजनाएं` : state.lang === 'mr' ? `${crop} शेतकऱ्यांसाठी योजना` : `Showing schemes for ${crop} farmers`}
            </Text>
          </View>
        )}

        <View style={styles.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.id}
              style={[styles.tabBtn, tab === tb.id && styles.tabBtnActive]}
              onPress={() => setTab(tb.id)}
            >
              <Text style={[styles.tabText, tab === tb.id && styles.tabTextActive]}>
                {tb.label}
              </Text>
              <View style={[styles.tabCount, tab === tb.id && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, tab === tb.id && styles.tabCountTextActive]}>{tb.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.search}
          placeholder={state.lang === 'hi' ? 'खोजें...' : state.lang === 'mr' ? 'शोधा...' : 'Search…'}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {tab === 'schemes' && (
          <View style={styles.filterRow}>
            {SCHEME_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.countText}>{filteredSchemes.length} {state.lang === 'hi' ? 'योजनाएं' : state.lang === 'mr' ? 'योजना' : 'schemes'}</Text>
          </View>
        )}
      </View>

      {tab === 'schemes' && (
        filteredSchemes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('noSchemes')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSchemes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const eligible = isEligibleScheme(item, crop, land);
              return (
                <View style={[styles.card, item.status === 'Closed' && styles.cardClosed, eligible && styles.cardEligible]}>
                  {eligible && (
                    <View style={styles.eligibleBadge}>
                      <Text style={styles.eligibleBadgeText}>✓ {state.lang === 'hi' ? 'आप पात्र हैं' : state.lang === 'mr' ? 'तुम्ही पात्र आहात' : 'You may be eligible'}</Text>
                    </View>
                  )}
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
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
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
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
                    <TouchableOpacity
                      style={styles.knowMoreBtn}
                      onPress={() => handleKnowMore(item.name, item.description, item.eligibility, item.benefit, item.deadline)}
                    >
                      <Text style={styles.knowMoreText}>{t('knowMore')}</Text>
                    </TouchableOpacity>
                    {item.status === 'Active' && (
                      <TouchableOpacity
                        style={[styles.applyBtn, eligible && styles.applyBtnEligible]}
                        onPress={() => Alert.alert(
                          state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Apply',
                          state.lang === 'hi'
                            ? 'आवेदन के लिए अपने नजदीकी कृषि कार्यालय में जाएं।'
                            : state.lang === 'mr'
                            ? 'अर्जासाठी तुमच्या जवळच्या कृषी कार्यालयास भेट द्या.'
                            : 'Visit your nearest Agriculture Office to apply for this scheme.'
                        )}
                      >
                        <Text style={styles.applyText}>{state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Apply Now'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      )}

      {(tab === 'insurance' || tab === 'subsidies') && (() => {
        const items = tab === 'insurance' ? filteredInsurance : filteredSubsidies;
        const emptyMsg = tab === 'insurance'
          ? (state.lang === 'hi' ? 'कोई बीमा योजना नहीं' : state.lang === 'mr' ? 'कोणताही विमा नाही' : 'No insurance schemes')
          : (state.lang === 'hi' ? 'कोई सब्सिडी नहीं' : state.lang === 'mr' ? 'कोणतेही अनुदान नाही' : 'No subsidies');

        if (items.length === 0) {
          return (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>{tab === 'insurance' ? '🛡️' : '💰'}</Text>
              <Text style={styles.emptyText}>{emptyMsg}</Text>
            </View>
          );
        }

        return (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const eligible = isEligibleItem(item, crop, land);
              return (
                <View style={[styles.card, item.status === 'Closed' && styles.cardClosed, eligible && styles.cardEligible]}>
                  {eligible && (
                    <View style={styles.eligibleBadge}>
                      <Text style={styles.eligibleBadgeText}>✓ {state.lang === 'hi' ? 'आप पात्र हैं' : state.lang === 'mr' ? 'तुम्ही पात्र आहात' : 'You may be eligible'}</Text>
                    </View>
                  )}
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, item.region === 'Central' ? styles.centralBadge : styles.stateBadge]}>
                        <Text style={[styles.typeBadgeText, item.region === 'Central' ? styles.centralText : styles.stateText]}>
                          {item.region === 'Central' ? t('centralScheme') : t('stateScheme')}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: tab === 'insurance' ? COLORS.infoLight : COLORS.primaryBg }]}>
                        <Text style={[styles.typeBadgeText, { color: tab === 'insurance' ? COLORS.info : COLORS.primary }]}>
                          {tab === 'insurance' ? '🛡️' : '💰'} {item.type}
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
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
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
                    {item.crops && item.crops.length > 0 && (
                      <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>🌾</Text>
                        <Text style={styles.metaText} numberOfLines={1}>{item.crops.join(', ')}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.knowMoreBtn}
                      onPress={() => handleKnowMore(item.name, item.description, item.eligibility, item.benefit, item.deadline)}
                    >
                      <Text style={styles.knowMoreText}>{t('knowMore')}</Text>
                    </TouchableOpacity>
                    {item.status === 'Active' && (
                      <TouchableOpacity
                        style={[styles.applyBtn, eligible && styles.applyBtnEligible]}
                        onPress={() => Alert.alert(
                          state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Apply',
                          state.lang === 'hi'
                            ? 'आवेदन के लिए अपने नजदीकी कृषि कार्यालय में जाएं।'
                            : state.lang === 'mr'
                            ? 'अर्जासाठी तुमच्या जवळच्या कृषी कार्यालयास भेट द्या.'
                            : 'Visit your nearest Agriculture Office to apply.'
                        )}
                      >
                        <Text style={styles.applyText}>{state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Apply Now'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        );
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FONT_SIZE.base, color: COLORS.textMuted },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, ...SHADOW.sm },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  eligibilityBanner: {
    backgroundColor: COLORS.secondaryLight, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 7,
    marginBottom: 10,
  },
  eligibilityText: { fontSize: FONT_SIZE.sm, color: COLORS.secondary, fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  tabCount: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  tabCountTextActive: { color: COLORS.white },
  search: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: FONT_SIZE.base, color: COLORS.text, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  countText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginLeft: 'auto' },
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    ...SHADOW.sm, borderWidth: 1.5, borderColor: COLORS.border,
  },
  cardClosed: { opacity: 0.7 },
  cardEligible: { borderColor: COLORS.secondary },
  eligibleBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  eligibleBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.secondary },
  cardTop: { marginBottom: 8 },
  cardName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, lineHeight: 22, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  centralBadge: { backgroundColor: COLORS.infoLight },
  stateBadge: { backgroundColor: COLORS.secondaryLight },
  typeBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  centralText: { color: COLORS.info },
  stateText: { color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  activeBadge: { backgroundColor: COLORS.secondaryLight },
  closedBadge: { backgroundColor: COLORS.border },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  activeText: { color: COLORS.secondary },
  closedText: { color: COLORS.textMuted },
  cardDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaIcon: { fontSize: 13 },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, maxWidth: 160 },
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
  applyBtnEligible: { backgroundColor: COLORS.secondary },
  applyText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.white },
});
