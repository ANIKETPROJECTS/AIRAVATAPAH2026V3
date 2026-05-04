import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type StatusType = "Pending" | "Active" | "Inactive" | "Rejected" | null;

function statusConfig(status: StatusType) {
  switch (status) {
    case "Active":
      return { label: "Verified", color: "#2E9E4F", bg: "rgba(46,158,79,0.12)", icon: "checkmark-circle" as const };
    case "Pending":
      return { label: "Pending Review", color: "#E8930A", bg: "rgba(232,147,10,0.12)", icon: "time" as const };
    case "Rejected":
      return { label: "Rejected", color: "#D93535", bg: "rgba(217,53,53,0.12)", icon: "close-circle" as const };
    default:
      return { label: "Not Registered", color: "#7AA890", bg: "rgba(122,168,144,0.12)", icon: "person-add" as const };
  }
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { farmer, mobile, refreshFarmer } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFarmer();
    setRefreshing(false);
  }, [refreshFarmer]);

  const status = farmer?.status ?? null;
  const sc = statusConfig(status);
  const firstName = farmer?.name && farmer.name !== "—"
    ? farmer.name.split(" ")[0]
    : mobile ? `+91 ${mobile.slice(0, 5)}...` : "Farmer";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.primaryDark }]}>
        <View>
          <Text style={[styles.greeting, { color: "#7AA890" }]}>Jai Kisan</Text>
          <Text style={[styles.name, { color: colors.white }]}>{firstName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.color }]}>
          <Ionicons name={sc.icon} size={14} color={sc.color} />
          <Text style={[styles.badgeText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {status === null && <UnregisteredView colors={colors} />}
        {status === "Pending" && <PendingView colors={colors} farmer={farmer} />}
        {status === "Active" && <ActiveView colors={colors} farmer={farmer} />}
        {status === "Rejected" && <RejectedView colors={colors} />}
      </ScrollView>
    </View>
  );
}

function UnregisteredView({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <View style={[styles.card, { backgroundColor: colors.primaryDark }]}>
        <View style={[styles.cardIcon, { backgroundColor: "rgba(199,154,32,0.12)" }]}>
          <Ionicons name="document-attach-outline" size={32} color={colors.accent} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.white }]}>Start Your Registration</Text>
        <Text style={[styles.cardDesc, { color: "#7AA890" }]}>
          Upload your Aadhaar, 7/12 land records, and bank passbook. Our AI will automatically extract your details.
        </Text>
        <TouchableOpacity
          style={[styles.cardBtn, { backgroundColor: colors.accent }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/upload"); }}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardBtnText, { color: colors.primaryDark }]}>Upload Documents</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
      {[
        { n: "1", t: "Upload 5 Documents", s: "Aadhaar, 7/12 forms, bank passbook" },
        { n: "2", t: "AI Extracts Your Data", s: "OCR reads all details automatically" },
        { n: "3", t: "Admin Verifies", s: "Your district officer reviews and approves" },
        { n: "4", t: "Access All Schemes", s: "PM-KISAN, KCC, Crop Insurance & more" },
      ].map((step) => (
        <View key={step.n} style={[styles.stepRow, { backgroundColor: colors.card }]}>
          <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.accent, fontFamily: "DMSans_700Bold", fontSize: 14 }}>{step.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>{step.t}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular", fontSize: 12, marginTop: 2 }}>{step.s}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PendingView({ colors, farmer }: { colors: ReturnType<typeof useColors>; farmer: ReturnType<typeof useAuth>["farmer"] }) {
  const docsCount = farmer?.docs?.length ?? 0;
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <View style={[styles.card, { backgroundColor: "#FFF8EC", borderWidth: 1.5, borderColor: "#E8930A" }]}>
        <View style={[styles.cardIcon, { backgroundColor: "rgba(232,147,10,0.12)" }]}>
          <Ionicons name="time-outline" size={32} color="#E8930A" />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Verification In Progress</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
          Your registration is under review by the district agriculture officer. You'll be notified once verified.
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: "#E8930A", width: `${Math.min(100, (docsCount / 5) * 100)}%` }]} />
        </View>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 4 }}>
          {docsCount}/5 documents uploaded
        </Text>
      </View>

      {docsCount < 5 && (
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/upload")}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Upload Remaining Documents</Text>
        </TouchableOpacity>
      )}

      {farmer?.farmerId ? (
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "DMSans_500Medium" }}>FARMER ID</Text>
          <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: "DMSans_700Bold", marginTop: 4 }}>{farmer.farmerId}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ActiveView({ colors, farmer }: { colors: ReturnType<typeof useColors>; farmer: ReturnType<typeof useAuth>["farmer"] }) {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <View style={[styles.card, { backgroundColor: "#F0FAF4", borderWidth: 1.5, borderColor: "#2E9E4F" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.accent, fontSize: 22, fontFamily: "DMSans_700Bold" }}>
              {(farmer?.name ?? "F").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "DMSans_700Bold" }}>{farmer?.name ?? "—"}</Text>
            <Text style={{ color: "#2E9E4F", fontSize: 13, fontFamily: "DMSans_500Medium" }}>
              <Ionicons name="checkmark-circle" size={13} color="#2E9E4F" /> Verified Farmer
            </Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "DMSans_500Medium" }}>{farmer?.farmerId}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FARM DETAILS</Text>
      <View style={[styles.grid, { gap: 12 }]}>
        {[
          { icon: "location-outline" as const, label: "Village", val: farmer?.village ?? "—" },
          { icon: "map-outline" as const, label: "District", val: farmer?.district ?? "—" },
          { icon: "resize-outline" as const, label: "Land Area", val: farmer?.land ? `${farmer.land} Hectare` : "—" },
          { icon: "leaf-outline" as const, label: "Main Crop", val: farmer?.crop ?? "—" },
        ].map((item) => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: colors.card, flex: 1, minWidth: "45%" }]}>
            <Ionicons name={item.icon} size={18} color={colors.accent} />
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "DMSans_500Medium", marginTop: 6 }}>{item.label}</Text>
            <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "DMSans_700Bold", marginTop: 2 }} numberOfLines={1}>{item.val}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.cardBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/(tabs)/schemes")}
        activeOpacity={0.85}
      >
        <Ionicons name="ribbon-outline" size={18} color={colors.accent} />
        <Text style={[styles.cardBtnText, { color: colors.white }]}>View Eligible Schemes</Text>
      </TouchableOpacity>
    </View>
  );
}

function RejectedView({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <View style={[styles.card, { backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#D93535" }]}>
        <View style={[styles.cardIcon, { backgroundColor: "rgba(217,53,53,0.1)" }]}>
          <Ionicons name="close-circle-outline" size={32} color="#D93535" />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Registration Rejected</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
          Your registration was not approved. Please visit your nearest agriculture office or re-upload correct documents.
        </Text>
        <TouchableOpacity
          style={[styles.cardBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/upload")}
        >
          <Text style={[styles.cardBtnText, { color: colors.white }]}>Re-upload Documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: { fontSize: 12, fontFamily: "DMSans_500Medium", letterSpacing: 1 },
  name: { fontSize: 22, fontFamily: "DMSans_700Bold", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontFamily: "DMSans_600SemiBold" },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  cardDesc: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },
  cardBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  cardBtnText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 12,
    padding: 14,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  outlineBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineBtnText: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCard: {
    borderRadius: 12,
    padding: 14,
    minWidth: "47%",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
