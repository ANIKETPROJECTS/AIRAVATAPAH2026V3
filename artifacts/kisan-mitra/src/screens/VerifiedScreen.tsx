import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW } from '../constants';

interface Props {
  onDone: () => void;
}

export default function VerifiedScreen({ onDone }: Props) {
  const { state } = useAuth();
  const lang = state.lang;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => { onDone(); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.iconEmoji}>✅</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>
            {lang === 'hi' ? 'बधाई हो! 🎉' : lang === 'mr' ? 'अभिनंदन! 🎉' : 'Congratulations! 🎉'}
          </Text>
          <Text style={styles.subtitle}>
            {lang === 'hi'
              ? 'आपका किसान पंजीकरण सफलतापूर्वक सत्यापित हो गया है।'
              : lang === 'mr'
              ? 'तुमची शेतकरी नोंदणी यशस्वीरीत्या पडताळली गेली आहे.'
              : 'Your farmer registration has been verified and approved by the Agriculture Officer.'}
          </Text>
        </Animated.View>

        {!!state.farmer?.farmerId && (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>
              {lang === 'hi' ? 'किसान आईडी' : lang === 'mr' ? 'शेतकरी आईडी' : 'Farmer ID'}
            </Text>
            <Text style={styles.idValue}>{state.farmer.farmerId}</Text>
          </View>
        )}

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>
            {lang === 'hi' ? '🌟 अब आप कर सकते हैं' : lang === 'mr' ? '🌟 आता तुम्ही करू शकता' : '🌟 You can now'}
          </Text>
          {[
            lang === 'hi' ? '✅ सरकारी योजनाओं के लिए आवेदन करें' : lang === 'mr' ? '✅ सरकारी योजनांसाठी अर्ज करा' : '✅ Apply for government schemes',
            lang === 'hi' ? '✅ फसल बीमा का लाभ उठाएं' : lang === 'mr' ? '✅ पीक विम्याचा लाभ घ्या' : '✅ Claim crop insurance benefits',
            lang === 'hi' ? '✅ सब्सिडी के लिए आवेदन करें' : lang === 'mr' ? '✅ अनुदानासाठी अर्ज करा' : '✅ Apply for subsidies',
            lang === 'hi' ? '✅ डीबीटी लाभ प्राप्त करें' : lang === 'mr' ? '✅ डीबीटी लाभ मिळवा' : '✅ Receive DBT benefits directly',
          ].map((item, i) => (
            <Text key={i} style={styles.benefitItem}>{item}</Text>
          ))}
        </View>

        <Text style={styles.autoNote}>
          {lang === 'hi' ? 'आपको 5 सेकंड में होम पर ले जाया जाएगा…' : lang === 'mr' ? '5 सेकंदात होमवर नेले जाईल…' : 'Taking you to your dashboard in 5 seconds…'}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={onDone}>
          <Text style={styles.btnText}>
            {lang === 'hi' ? '🚀 मेरे प्रोफाइल पर जाएं' : lang === 'mr' ? '🚀 माझ्या प्रोफाइलवर जा' : '🚀 Go to My Profile'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 20, alignItems: 'center' },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#E6FAF0', alignItems: 'center', justifyContent: 'center',
    marginBottom: 28, ...SHADOW.md,
  },
  iconEmoji: { fontSize: 60 },
  title: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.secondary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 320, marginBottom: 28 },
  idCard: {
    backgroundColor: '#E6FAF0', borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 24, alignItems: 'center', borderWidth: 2, borderColor: COLORS.secondary, width: '100%',
  },
  idLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  idValue: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.secondary, letterSpacing: 2 },
  benefitsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20,
    width: '100%', marginBottom: 20, ...SHADOW.sm, gap: 10,
  },
  benefitsTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  benefitItem: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 22 },
  autoNote: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' },
  btn: {
    backgroundColor: COLORS.secondary, borderRadius: RADIUS.lg, paddingVertical: 18,
    paddingHorizontal: 32, alignItems: 'center', width: '100%', ...SHADOW.md,
  },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: '800' },
});
