import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^\d{10}$/.test(mobile);

  async function handleSend() {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await api.sendOtp(mobile);
      navigation.navigate('Otp', { mobile, devOtp: result.otp });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← {t('back')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📱</Text>
            </View>
            <Text style={styles.title}>{t('mobileNumber')}</Text>
            <Text style={styles.subtitle}>{t('enterMobile')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>+91</Text>
            <View style={styles.inputRow}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/\D/g, ''))}
                onSubmitEditing={handleSend}
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSend}
            disabled={!isValid || loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>{t('sendOtp')} →</Text>}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 Your mobile number is used only for OTP verification and linked to your farmer profile.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 32 },
  backText: { color: COLORS.primary, fontSize: FONT_SIZE.base, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconEmoji: { fontSize: 34 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },
  label: { display: 'none' },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 4,
    marginBottom: 24, borderWidth: 2, borderColor: COLORS.border, ...SHADOW.sm,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  prefix: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginRight: 12 },
  input: {
    flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text,
    paddingVertical: 14, letterSpacing: 2,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md,
  },
  btnDisabled: { backgroundColor: COLORS.border },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  infoBox: {
    marginTop: 24, padding: 16, backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.info,
  },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.info, lineHeight: 20 },
});
