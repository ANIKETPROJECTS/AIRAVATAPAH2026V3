import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Otp'>;
  route: RouteProp<RootStackParamList, 'Otp'>;
};

const OTP_TTL = 300;

export default function OtpScreen({ navigation, route }: Props) {
  const { state, login } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const { mobile, devOtp: initialDevOtp } = route.params;

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(OTP_TTL);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(initialDevOtp ?? null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const canResend = timer === 0;

  async function handleVerify() {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const result = await api.verifyOtp(mobile, otp);
      if (!result.success) throw new Error('Invalid OTP');
      await login(result.token, mobile, result.farmer);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setResending(true);
    try {
      const result = await api.sendOtp(mobile);
      setOtp('');
      setTimer(OTP_TTL);
      if (result.otp) setDevOtp(result.otp);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP.');
    } finally {
      setResending(false);
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
              <Text style={styles.iconEmoji}>🔐</Text>
            </View>
            <Text style={styles.title}>{t('enterOtp')}</Text>
            <Text style={styles.subtitle}>
              {t('otpSentTo')}{'\n'}
              <Text style={styles.mobileText}>+91 {mobile}</Text>
            </Text>
          </View>

          {devOtp && (
            <TouchableOpacity
              style={styles.devBanner}
              onPress={() => setOtp(devOtp)}
            >
              <Text style={styles.devText}>
                🔧 Dev mode: OTP is <Text style={styles.devOtp}>{devOtp}</Text> — tap to fill
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.otpCard}>
            <TextInput
              style={styles.otpInput}
              placeholder="------"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, ''))}
              textAlign="center"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, (otp.length !== 6 || loading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={otp.length !== 6 || loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>{t('verify')}</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendLink}>{resending ? '...' : t('resendOtp')}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                {t('resendIn')} {mins}:{String(secs).padStart(2, '0')} {t('seconds')}
              </Text>
            )}
          </View>

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 The OTP is valid for 5 minutes. Check your SMS inbox.
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
  header: { alignItems: 'center', marginBottom: 32 },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconEmoji: { fontSize: 34 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  mobileText: { fontWeight: '700', color: COLORS.text },
  devBanner: {
    backgroundColor: '#FEF9C3', borderRadius: RADIUS.md, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FDE047',
  },
  devText: { fontSize: FONT_SIZE.sm, color: '#713F12' },
  devOtp: { fontWeight: '800', letterSpacing: 2 },
  otpCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginBottom: 24,
    borderWidth: 2, borderColor: COLORS.border, ...SHADOW.sm,
  },
  otpInput: {
    fontSize: 32, fontWeight: '800', color: COLORS.text,
    paddingVertical: 20, letterSpacing: 16,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md, marginBottom: 20,
  },
  btnDisabled: { backgroundColor: COLORS.border },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  resendRow: { alignItems: 'center', marginBottom: 24 },
  resendLink: { color: COLORS.primary, fontSize: FONT_SIZE.base, fontWeight: '700' },
  timerText: { fontSize: FONT_SIZE.base, color: COLORS.textMuted },
  hintBox: {
    padding: 16, backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.secondary,
  },
  hintText: { fontSize: FONT_SIZE.sm, color: '#166534', lineHeight: 20 },
});
