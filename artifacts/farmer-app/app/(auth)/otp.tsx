import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/query-client";
import type { FarmerProfile } from "@/context/AuthContext";

type Step = "mobile" | "otp";

interface SendOtpResponse { success: boolean; message: string; otp?: string }
interface VerifyOtpResponse {
  success: boolean;
  token: string;
  farmer: FarmerProfile | null;
  isRegistered: boolean;
}

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    const trimmed = mobile.trim().replace(/\D/g, "");
    if (trimmed.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiRequest<SendOtpResponse>("POST", "/auth/send-otp", { mobile: trimmed });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRef.current?.focus(), 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const trimmedMobile = mobile.trim().replace(/\D/g, "");
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<VerifyOtpResponse>("POST", "/auth/verify-otp", {
        mobile: trimmedMobile,
        otp: trimmedOtp,
      });
      await login(trimmedMobile, res.token, res.farmer);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.primaryDark }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step === "otp") { setStep("mobile"); setOtp(""); setError(""); }
              else router.back();
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.accent} />
          </TouchableOpacity>
          <View style={styles.logoSmall}>
            <Ionicons name="leaf" size={22} color={colors.accent} />
          </View>
        </View>

        <View style={[styles.content, { paddingBottom: botPad + 24 }]}>
          <Text style={[styles.title, { color: colors.white }]}>
            {step === "mobile" ? "Enter Mobile Number" : "Verify OTP"}
          </Text>
          <Text style={[styles.subtitle, { color: "#7AA890" }]}>
            {step === "mobile"
              ? "We'll send you a one-time password to verify your identity"
              : `OTP sent to +91 ${mobile}`}
          </Text>

          <View style={[styles.inputCard, { backgroundColor: colors.primary }]}>
            {step === "mobile" ? (
              <View style={[styles.inputRow, { borderColor: colors.border }]}>
                <Text style={[styles.prefix, { color: colors.accent }]}>+91</Text>
                <TextInput
                  style={[styles.input, { color: colors.white, fontFamily: "DMSans_500Medium" }]}
                  placeholder="Mobile Number"
                  placeholderTextColor="#4A7060"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(t) => { setMobile(t); setError(""); }}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                  autoFocus
                />
              </View>
            ) : (
              <View style={[styles.inputRow, { borderColor: colors.border }]}>
                <Ionicons name="key-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <TextInput
                  ref={otpRef}
                  style={[styles.input, { color: colors.white, fontFamily: "DMSans_500Medium", letterSpacing: 6, fontSize: 22 }]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#4A7060"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(t) => { setOtp(t); setError(""); }}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />
              </View>
            )}

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            ) : null}

            {step === "otp" ? (
              <TouchableOpacity
                onPress={countdown === 0 ? handleSendOtp : undefined}
                disabled={countdown > 0}
                style={{ alignSelf: "flex-end", marginTop: 8 }}
              >
                <Text style={{ color: countdown > 0 ? "#4A7060" : colors.accent, fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.accent, opacity: loading ? 0.75 : 1 }]}
            onPress={step === "mobile" ? handleSendOtp : handleVerifyOtp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryDark} />
            ) : (
              <>
                <Text style={[styles.ctaText, { color: colors.primaryDark }]}>
                  {step === "mobile" ? "Send OTP" : "Verify & Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: { padding: 8, borderRadius: 8 },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#C79A20",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 20,
    marginTop: -8,
  },
  inputCard: {
    borderRadius: 16,
    padding: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: 12,
  },
  prefix: {
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    height: 40,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 10,
  },
  ctaBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
  },
});
