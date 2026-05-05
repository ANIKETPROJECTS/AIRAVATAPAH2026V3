import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

export default function RejectedScreen() {
  const { state, logout } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;

  async function handleLogout() {
    if (Platform.OS === 'web') {
      const msg = t('logoutConfirm') || 'Are you sure you want to logout?';
      if (window.confirm(msg)) await logout();
      return;
    }
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => { logout(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>❌</Text>
          </View>
          <Text style={styles.title}>
            {state.lang === 'hi' ? 'आवेदन अस्वीकृत' : state.lang === 'mr' ? 'अर्ज नाकारला' : 'Application Rejected'}
          </Text>
          <Text style={styles.subtitle}>
            {state.lang === 'hi'
              ? 'आपका किसान पंजीकरण अनुरोध अस्वीकार कर दिया गया है।'
              : state.lang === 'mr'
              ? 'तुमचा शेतकरी नोंदणी अर्ज नाकारण्यात आला आहे.'
              : 'Your farmer registration request has been rejected by the agriculture officer.'}
          </Text>
        </View>

        {!!farmer?.farmerId && (
          <View style={styles.idCard}>
            <Text style={styles.idLabel}>{t('farmerId')}</Text>
            <Text style={styles.idValue}>{farmer.farmerId}</Text>
            <Text style={styles.idMobile}>+91 {state.mobile}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {state.lang === 'hi' ? 'अगले कदम' : state.lang === 'mr' ? 'पुढील पायऱ्या' : 'What to do next'}
          </Text>
          <View style={styles.stepList}>
            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>
                {state.lang === 'hi'
                  ? 'अपने नजदीकी कृषि कार्यालय से संपर्क करें और अस्वीकृति का कारण जानें।'
                  : state.lang === 'mr'
                  ? 'तुमच्या जवळच्या कृषी कार्यालयाशी संपर्क साधा आणि नाकारण्याचे कारण जाणून घ्या.'
                  : 'Visit your nearest Agriculture Office to learn the reason for rejection.'}
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>
                {state.lang === 'hi'
                  ? 'अपने दस्तावेज़ सही करके नए मोबाइल नंबर से पुनः पंजीकरण करें।'
                  : state.lang === 'mr'
                  ? 'तुमचे कागदपत्र दुरुस्त करा आणि नव्या मोबाइल नंबरने पुन्हा नोंदणी करा.'
                  : 'Correct your documents and re-register with a new mobile number.'}
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>
                {state.lang === 'hi'
                  ? 'किसी समस्या के लिए कृषि विभाग हेल्पलाइन: 1800-233-4000'
                  : state.lang === 'mr'
                  ? 'मदतीसाठी कृषी विभाग हेल्पलाइन: 1800-233-4000'
                  : 'For help, contact Agriculture Dept. Helpline: 1800-233-4000'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>📞 {state.lang === 'hi' ? 'सहायता केंद्र' : state.lang === 'mr' ? 'मदत केंद्र' : 'Help Center'}</Text>
          <Text style={styles.helpText}>
            {state.lang === 'hi'
              ? 'महाराष्ट्र कृषि विभाग — जिला कार्यालय'
              : state.lang === 'mr'
              ? 'महाराष्ट्र कृषी विभाग — जिल्हा कार्यालय'
              : 'Maharashtra Agriculture Dept. — District Office'}
          </Text>
          <Text style={styles.helpPhone}>1800-233-4000</Text>
          <Text style={styles.helpHours}>
            {state.lang === 'hi' ? 'सोम–शनि, सुबह 10 – शाम 5' : state.lang === 'mr' ? 'सोम–शनि, सकाळी 10 – सायं 5' : 'Mon–Sat, 10 AM – 5 PM'}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
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
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.errorLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...SHADOW.md,
  },
  iconEmoji: { fontSize: 48 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.error, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  idCard: {
    backgroundColor: COLORS.errorLight, borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: COLORS.error, ...SHADOW.sm,
  },
  idLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.error, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  idValue: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.error, letterSpacing: 2 },
  idMobile: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 16, ...SHADOW.sm,
  },
  infoTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  stepList: { gap: 14 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.error,
    color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '800',
    textAlign: 'center', lineHeight: 26,
  },
  stepText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
  helpCard: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md, padding: 16,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: COLORS.info, alignItems: 'center',
  },
  helpTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.info, marginBottom: 8 },
  helpText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 4 },
  helpPhone: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.info, marginBottom: 4 },
  helpHours: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  logoutBtn: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.error, ...SHADOW.sm,
  },
  logoutText: { color: COLORS.error, fontSize: FONT_SIZE.base, fontWeight: '700' },
});
