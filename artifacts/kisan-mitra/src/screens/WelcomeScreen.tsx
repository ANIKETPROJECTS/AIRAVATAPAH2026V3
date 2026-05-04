import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Lang } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

const LANGS: { id: Lang; native: string; english: string }[] = [
  { id: 'en', native: 'English', english: 'English' },
  { id: 'hi', native: 'हिंदी', english: 'Hindi' },
  { id: 'mr', native: 'मराठी', english: 'Marathi' },
];

export default function WelcomeScreen({ navigation }: Props) {
  const { state, setLang } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌾</Text>
          </View>
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.appNameHi}>किसान मित्र</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={styles.langSection}>
          <Text style={styles.langTitle}>{t('selectLang')}</Text>
          <View style={styles.langRow}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setLang(l.id)}
                style={[styles.langBtn, state.lang === l.id && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, state.lang === l.id && styles.langBtnTextActive]}>
                  {l.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('getStarted')} →</Text>
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏛️ Govt. of Maharashtra</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔒 Secure & Verified</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 40 },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, ...SHADOW.md,
  },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.primaryDark, letterSpacing: -0.5 },
  appNameHi: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  tagline: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  langSection: { marginBottom: 32 },
  langTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  langRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  langBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  langBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  langBtnText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.text },
  langBtnTextActive: { color: COLORS.white },
  footer: { gap: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md,
  },
  primaryBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  badge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  badgeText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '500' },
});
