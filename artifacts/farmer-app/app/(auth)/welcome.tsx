import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const FEATURES = [
  { icon: "document-text-outline" as const, title: "Upload Documents", sub: "Aadhaar, 7/12, Bank Passbook" },
  { icon: "scan-outline" as const, title: "AI-Powered OCR", sub: "Auto-fills your details instantly" },
  { icon: "checkmark-shield-outline" as const, title: "Admin Verification", sub: "Get verified by your district officer" },
  { icon: "cash-outline" as const, title: "Scheme Benefits", sub: "PM-KISAN, KCC, Crop Insurance & more" },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryDark }]}>
      <View style={[styles.top, { paddingTop: topPad + 32 }]}>
        <View style={styles.logoRing}>
          <Ionicons name="leaf" size={40} color={colors.accent} />
        </View>
        <Text style={[styles.appName, { color: colors.accent }]}>कृषी सुविधा</Text>
        <Text style={[styles.appSub, { color: "#6B9080" }]}>KISAN SEVA</Text>
        <Text style={[styles.tagline, { color: "#A8C4B0" }]}>
          Maharashtra's Digital Farmer{"\n"}Registration Portal
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.primary }]}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: "rgba(199,154,32,0.15)" }]}>
              <Ionicons name={f.icon} size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: colors.white }]}>{f.title}</Text>
              <Text style={[styles.featureSub, { color: "#7AA890" }]}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.bottom, { paddingBottom: botPad + 24 }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/(auth)/otp")}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.primaryDark }]}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={[styles.disclaimer, { color: "#4A7060" }]}>
          Government of Maharashtra — Agriculture Department
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "#C79A20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(199,154,32,0.08)",
  },
  appName: {
    fontSize: 32,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1,
  },
  appSub: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 4,
    marginTop: 2,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    flex: 1,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  bottom: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  btn: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
});
