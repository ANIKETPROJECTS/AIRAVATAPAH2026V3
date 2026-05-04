import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import { getUploadState, saveUploadState, type DocUploadStatus } from "@/lib/storage";

const DOCS = [
  { id: "aadhar", label: "Aadhaar Card", labelMr: "आधार कार्ड", icon: "card-outline" as const, desc: "Upload your Aadhaar card (front & back)" },
  { id: "bank_passbook", label: "Bank Passbook", labelMr: "बँक पासबुक", icon: "wallet-outline" as const, desc: "First page showing account details" },
  { id: "form7", label: "Form 7 (7/12)", labelMr: "फॉर्म 7 — सात-बारा", icon: "document-text-outline" as const, desc: "Ownership register (Adhikar Abhilekh)" },
  { id: "form12", label: "Form 12 (Crop)", labelMr: "फॉर्म 12 — पीक पाहणी", icon: "leaf-outline" as const, desc: "Annual crop inspection register" },
  { id: "form8a", label: "Form 8A", labelMr: "फॉर्म 8-अ", icon: "grid-outline" as const, desc: "Holding register (Dharan Jaminicha)" },
];

type DocStatus = DocUploadStatus["status"];

function statusIcon(s: DocStatus) {
  if (s === "done") return { name: "checkmark-circle" as const, color: "#2E9E4F" };
  if (s === "error") return { name: "close-circle" as const, color: "#D93535" };
  if (s === "processing" || s === "uploading") return { name: "time" as const, color: "#E8930A" };
  return { name: "cloud-upload-outline" as const, color: "#7AA890" };
}

export default function UploadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { mobile, refreshFarmer } = useAuth();

  const [uploadStates, setUploadStates] = useState<Record<string, DocUploadStatus>>({});
  const [polling, setPolling] = useState<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    if (!mobile) return;
    (async () => {
      const saved = await getUploadState(mobile);
      const map: Record<string, DocUploadStatus> = {};
      for (const s of saved) map[s.docId] = s;
      setUploadStates(map);
      for (const s of saved) {
        if (s.status === "processing" && s.requestId) {
          startPolling(s.docId, s.requestId, map);
        }
      }
    })();
    return () => { Object.values(polling).forEach(clearInterval); };
  }, [mobile]);

  const persist = useCallback(async (states: Record<string, DocUploadStatus>) => {
    if (!mobile) return;
    await saveUploadState(mobile, Object.values(states));
  }, [mobile]);

  function updateDoc(docId: string, partial: Partial<DocUploadStatus>) {
    setUploadStates((prev) => {
      const next = { ...prev, [docId]: { docId, requestId: null, status: "pending" as const, ...prev[docId], ...partial } };
      persist(next);
      return next;
    });
  }

  function startPolling(docId: string, requestId: string, initStates?: Record<string, DocUploadStatus>) {
    const interval = setInterval(async () => {
      try {
        const base = getApiUrl();
        const res = await fetch(`${base}/extract/${requestId}`);
        if (!res.ok) return;
        const data = await res.json() as { status: string };
        if (data.status === "complete") {
          clearInterval(interval);
          setPolling((p) => { const n = { ...p }; delete n[docId]; return n; });
          updateDoc(docId, { status: "done" });
          await refreshFarmer();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (data.status === "error") {
          clearInterval(interval);
          setPolling((p) => { const n = { ...p }; delete n[docId]; return n; });
          updateDoc(docId, { status: "error", errorMsg: "OCR processing failed" });
        }
      } catch {}
    }, 4000);
    setPolling((p) => ({ ...p, [docId]: interval }));
  }

  async function handleUpload(docId: string) {
    if (!mobile) {
      Alert.alert("Error", "Please login first");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateDoc(docId, { status: "uploading" });

      const asset = result.assets[0];
      const base = getApiUrl();
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append("file", blob, asset.name);
      } else {
        (formData as FormData & { append(k: string, v: unknown): void }).append("file", {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
        } as unknown as Blob);
      }

      formData.append("document_type", docId);
      formData.append("profile_phone", mobile);
      formData.append("mode", "accurate");

      const uploadRes = await fetch(`${base}/extract`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" })) as { error?: string };
        updateDoc(docId, { status: "error", errorMsg: err.error ?? "Upload failed" });
        return;
      }

      const uploadData = await uploadRes.json() as { request_id: string };
      updateDoc(docId, { status: "processing", requestId: uploadData.request_id });
      startPolling(docId, uploadData.request_id);
      await refreshFarmer();
    } catch (e) {
      updateDoc(docId, { status: "error", errorMsg: e instanceof Error ? e.message : "Upload failed" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const doneCount = Object.values(uploadStates).filter((s) => s.status === "done").length;
  const allDone = doneCount === 5;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.primaryDark }]}>
        <Text style={[styles.headerTitle, { color: colors.white }]}>Upload Documents</Text>
        <Text style={[styles.headerSub, { color: "#7AA890" }]}>
          {doneCount}/5 completed
        </Text>
      </View>

      <View style={[styles.progressBarOuter, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressBarInner, {
          backgroundColor: allDone ? "#2E9E4F" : colors.accent,
          width: `${(doneCount / 5) * 100}%`,
        }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {allDone && (
          <View style={[styles.allDoneCard, { backgroundColor: "#F0FAF4", borderColor: "#2E9E4F" }]}>
            <Ionicons name="checkmark-circle" size={28} color="#2E9E4F" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontFamily: "DMSans_700Bold", fontSize: 15 }}>All Documents Uploaded!</Text>
              <Text style={{ color: colors.mutedForeground, fontFamily: "DMSans_400Regular", fontSize: 13, marginTop: 2 }}>
                Awaiting admin verification
              </Text>
            </View>
          </View>
        )}

        {DOCS.map((doc) => {
          const st = uploadStates[doc.id];
          const docStatus: DocStatus = st?.status ?? "pending";
          const si = statusIcon(docStatus);

          return (
            <View key={doc.id} style={[styles.docCard, { backgroundColor: colors.card, borderColor: docStatus === "done" ? "#2E9E4F" : colors.border }]}>
              <View style={styles.docCardTop}>
                <View style={[styles.docIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={doc.icon} size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docLabel, { color: colors.foreground }]}>{doc.label}</Text>
                  <Text style={[styles.docLabelMr, { color: colors.mutedForeground }]}>{doc.labelMr}</Text>
                </View>
                <Ionicons name={si.name} size={22} color={si.color} />
              </View>

              <Text style={[styles.docDesc, { color: colors.mutedForeground }]}>{doc.desc}</Text>

              {docStatus === "error" && st?.errorMsg ? (
                <Text style={{ color: "#D93535", fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 4 }}>
                  {st.errorMsg}
                </Text>
              ) : null}

              {(docStatus === "uploading" || docStatus === "processing") && (
                <View style={[styles.processingRow, { backgroundColor: "rgba(232,147,10,0.08)" }]}>
                  <ActivityIndicator size="small" color="#E8930A" />
                  <Text style={{ color: "#E8930A", fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                    {docStatus === "uploading" ? "Uploading..." : "OCR Processing..."}
                  </Text>
                </View>
              )}

              {(docStatus === "pending" || docStatus === "error" || docStatus === "done") && (
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    {
                      backgroundColor: docStatus === "done" ? "transparent" : colors.primary,
                      borderWidth: docStatus === "done" ? 1.5 : 0,
                      borderColor: "#2E9E4F",
                    },
                  ]}
                  onPress={() => handleUpload(doc.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={docStatus === "done" ? "refresh-outline" : "cloud-upload-outline"}
                    size={16}
                    color={docStatus === "done" ? "#2E9E4F" : colors.accent}
                  />
                  <Text style={{ color: docStatus === "done" ? "#2E9E4F" : colors.accent, fontFamily: "DMSans_600SemiBold", fontSize: 13 }}>
                    {docStatus === "done" ? "Re-upload" : docStatus === "error" ? "Try Again" : "Upload"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18 }}>
            Upload clear photos or PDFs. Ensure all text is readable. Documents in Marathi are fully supported.
          </Text>
        </View>
      </ScrollView>
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
  progressBarOuter: { height: 4 },
  progressBarInner: { height: 4 },
  allDoneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  docCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  docCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  docLabel: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  docLabelMr: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  docDesc: { fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  uploadBtn: {
    height: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
});
