import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

interface InfoRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string | undefined;
  accent: string;
  muted: string;
  foreground: string;
}

function InfoRow({ icon, label, value, accent, muted, foreground }: InfoRowProps) {
  if (!value || value === "—") return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={accent} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: muted, fontSize: 11, fontFamily: "DMSans_500Medium", letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
        <Text style={{ color: foreground, fontSize: 14, fontFamily: "DMSans_500Medium", marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { farmer, mobile, logout, refreshFarmer } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const statusColor = farmer?.status === "Active" ? "#2E9E4F" : farmer?.status === "Pending" ? "#E8930A" : "#D93535";
  const statusLabel = farmer?.status ?? "Not Registered";

  function handleLogout() {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/(auth)/welcome"));
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.primaryDark }]}>
        <View style={styles.avatarWrap}>
          <Text style={[styles.avatarText, { color: colors.accent }]}>
            {(farmer?.name && farmer.name !== "—" ? farmer.name : mobile ?? "F").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={[styles.profileName, { color: colors.white }]}>
            {farmer?.name && farmer.name !== "—" ? farmer.name : mobile ? `+91 ${mobile}` : "Farmer"}
          </Text>
          {farmer?.farmerId && (
            <Text style={{ color: "#7AA890", fontSize: 12, fontFamily: "DMSans_500Medium" }}>{farmer.farmerId}</Text>
          )}
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={{ color: statusColor, fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <Section title="PERSONAL DETAILS" colors={colors}>
          <InfoRow icon="person-outline" label="Full Name" value={farmer?.name} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="call-outline" label="Mobile" value={mobile ? `+91 ${mobile}` : undefined} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="card-outline" label="Aadhaar" value={farmer?.aadhaar} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={farmer?.dob} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="male-female-outline" label="Gender" value={farmer?.gender} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="location-outline" label="Address" value={farmer?.address} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
        </Section>

        <Section title="LAND DETAILS" colors={colors}>
          <InfoRow icon="map-outline" label="Village" value={farmer?.village} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="business-outline" label="Taluka" value={farmer?.taluka} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="flag-outline" label="District" value={farmer?.district} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="resize-outline" label="Land Area" value={farmer?.land ? `${farmer.land} Hectare` : undefined} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="leaf-outline" label="Main Crop" value={farmer?.crop} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="document-outline" label="Survey Number" value={farmer?.surveyNumber} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
        </Section>

        <Section title="BANK DETAILS" colors={colors}>
          <InfoRow icon="business-outline" label="Bank Name" value={farmer?.bankName} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="wallet-outline" label="Account Number" value={farmer?.bankAccount} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
          <InfoRow icon="barcode-outline" label="IFSC Code" value={farmer?.ifsc} accent={colors.accent} muted={colors.mutedForeground} foreground={colors.foreground} />
        </Section>

        {(farmer?.docs?.length ?? 0) > 0 && (
          <Section title="UPLOADED DOCUMENTS" colors={colors}>
            {farmer!.docs!.map((doc, i) => (
              <View key={i} style={styles.docItem}>
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={{ flex: 1, color: colors.foreground, fontFamily: "DMSans_500Medium", fontSize: 13 }}>{doc.name}</Text>
                <Text style={{ color: "#2E9E4F", fontSize: 11, fontFamily: "DMSans_500Medium" }}>{doc.status}</Text>
              </View>
            ))}
          </Section>
        )}

        <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.border }]} onPress={async () => {
          setRefreshing(true);
          await refreshFarmer();
          setRefreshing(false);
        }}>
          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: "DMSans_500Medium", fontSize: 14 }}>
            {refreshing ? "Refreshing..." : "Refresh Profile"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: "#D93535" }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#D93535" />
          <Text style={{ color: "#D93535", fontFamily: "DMSans_600SemiBold", fontSize: 14 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(199,154,32,0.15)",
    borderWidth: 2,
    borderColor: "#C79A20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontFamily: "DMSans_700Bold" },
  profileName: { fontSize: 20, fontFamily: "DMSans_700Bold" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDE8DD",
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDE8DD",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
});
