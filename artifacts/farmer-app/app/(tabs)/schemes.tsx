import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

interface Scheme {
  id: string;
  name: string;
  type: "CENTRAL" | "STATE";
  status: string;
  description?: string;
  benefit?: string;
  eligibility?: string;
  maxAnnualBenefit?: number | string;
}

export default function SchemesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { farmer } = useAuth();
  const isVerified = farmer?.status === "Active";

  const { data: schemes, isLoading, error, refetch } = useQuery<Scheme[]>({
    queryKey: ["/schemes"],
    enabled: isVerified,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.primaryDark }]}>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Government Schemes</Text>
        <Text style={[styles.headerSub, { color: "#7AA890" }]}>
          {isVerified ? `${schemes?.length ?? 0} schemes available` : "Complete registration to unlock"}
        </Text>
      </View>

      {!isVerified ? (
        <View style={styles.lockedView}>
          <View style={[styles.lockIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.foreground }]}>Schemes Locked</Text>
          <Text style={[styles.lockDesc, { color: colors.mutedForeground }]}>
            Complete your registration and get verified by the district officer to access PM-KISAN, KCC, Crop Insurance, and more.
          </Text>
          <TouchableOpacity
            style={[styles.lockBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/upload")}
          >
            <Text style={{ color: colors.white, fontFamily: "DMSans_600SemiBold", fontSize: 15 }}>Register Now</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular", textAlign: "center", marginBottom: 16 }}>
            Failed to load schemes
          </Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: colors.primary, fontFamily: "DMSans_600SemiBold" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={schemes ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.eligibleBanner, { backgroundColor: "#F0FAF4", borderColor: "#2E9E4F" }]}>
              <Ionicons name="checkmark-circle" size={20} color="#2E9E4F" />
              <Text style={{ flex: 1, color: colors.foreground, fontFamily: "DMSans_600SemiBold", fontSize: 13 }}>
                You are eligible for {schemes?.filter((s) => s.status === "Active").length ?? 0} active schemes
              </Text>
            </View>
          }
          renderItem={({ item }) => <SchemeCard scheme={item} colors={colors} />}
          scrollEnabled={!!(schemes && schemes.length > 0)}
        />
      )}
    </View>
  );
}

function SchemeCard({ scheme, colors }: { scheme: Scheme; colors: ReturnType<typeof useColors> }) {
  const isCentral = scheme.type === "CENTRAL";
  const isActive = scheme.status === "Active";

  return (
    <View style={[styles.schemeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.schemeTop}>
        <View style={[styles.schemeTypeTag, {
          backgroundColor: isCentral ? "rgba(26,110,181,0.1)" : "rgba(27,64,48,0.1)",
        }]}>
          <Text style={{ color: isCentral ? "#1A6EB5" : colors.primary, fontSize: 10, fontFamily: "DMSans_600SemiBold", letterSpacing: 0.5 }}>
            {isCentral ? "CENTRAL" : "STATE"}
          </Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isActive ? "#2E9E4F" : "#D93535" }]} />
        <Text style={{ color: isActive ? "#2E9E4F" : "#D93535", fontSize: 11, fontFamily: "DMSans_500Medium" }}>
          {isActive ? "Active" : "Closed"}
        </Text>
      </View>

      <Text style={[styles.schemeName, { color: colors.foreground }]}>{scheme.name}</Text>

      {scheme.description ? (
        <Text style={[styles.schemeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {scheme.description}
        </Text>
      ) : null}

      {scheme.maxAnnualBenefit ? (
        <View style={[styles.benefitRow, { backgroundColor: "rgba(199,154,32,0.08)" }]}>
          <Ionicons name="cash-outline" size={16} color={colors.accent} />
          <Text style={{ color: colors.foreground, fontFamily: "DMSans_600SemiBold", fontSize: 13 }}>
            ₹{scheme.maxAnnualBenefit}
            <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular", fontSize: 12 }}> / year</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: "DMSans_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  lockedView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  lockIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  lockTitle: { fontSize: 20, fontFamily: "DMSans_700Bold", textAlign: "center" },
  lockDesc: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 },
  lockBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  eligibleBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  schemeCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  schemeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  schemeTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: "auto",
  },
  schemeName: { fontSize: 15, fontFamily: "DMSans_700Bold", lineHeight: 20 },
  schemeDesc: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
