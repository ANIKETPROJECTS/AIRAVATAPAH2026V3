import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { REQUIRED_DOCUMENTS, DocUploadState, DocUploadStatus, DocumentTypeId } from '../types';

export default function DocumentUploadScreen() {
  const { state, updateFarmer } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;

  const [docStates, setDocStates] = useState<Record<DocumentTypeId, DocUploadState>>({
    aadhar: { status: 'idle' },
    bank_passbook: { status: 'idle' },
    form7: { status: 'idle' },
    form12: { status: 'idle' },
    form8a: { status: 'idle' },
  });
  const [submitting, setSubmitting] = useState(false);

  function setDoc(id: DocumentTypeId, patch: Partial<DocUploadState>) {
    setDocStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const mobile = state.mobile ?? '';

  const allDone = REQUIRED_DOCUMENTS.every((d) => docStates[d.id].status === 'done');
  const doneCount = REQUIRED_DOCUMENTS.filter((d) => docStates[d.id].status === 'done').length;

  async function pollUntilDone(docId: DocumentTypeId, requestId: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const result = await api.pollExtraction(requestId);
        if (result.status === 'complete') {
          setDoc(docId, { status: 'done' });
          return;
        }
        if (result.status === 'error') {
          setDoc(docId, { status: 'error', error: result.error ?? 'Processing failed' });
          return;
        }
      } catch {
        // keep polling
      }
    }
    setDoc(docId, { status: 'error', error: 'Processing timed out. Please re-upload.' });
  }

  async function pickAndUpload(docId: DocumentTypeId) {
    if (!mobile) { Alert.alert('Error', 'Session expired. Please login again.'); return; }

    setDoc(docId, { status: 'picking', error: undefined });

    try {
      let fileUri = '';
      let fileName = `${docId}.pdf`;
      let fileMime = 'application/pdf';

      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: false,
        });
        if (result.canceled || !result.assets?.[0]) {
          setDoc(docId, { status: 'idle' });
          return;
        }
        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = asset.name ?? fileName;
        fileMime = asset.mimeType ?? fileMime;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Please allow access to your photos to upload documents.');
          setDoc(docId, { status: 'idle' });
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsMultipleSelection: false,
        });
        if (result.canceled || !result.assets?.[0]) {
          setDoc(docId, { status: 'idle' });
          return;
        }
        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = `${docId}.jpg`;
        fileMime = 'image/jpeg';
      }

      setDoc(docId, { status: 'uploading', fileName });

      const submitResult = await api.uploadDocument(fileUri, fileName, fileMime, docId, mobile);
      const requestId = submitResult.request_id;

      setDoc(docId, { status: 'processing', requestId });

      pollUntilDone(docId, requestId);
    } catch (err) {
      setDoc(docId, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed. Please try again.',
      });
    }
  }

  async function handleSubmit() {
    if (!allDone) return;
    setSubmitting(true);
    try {
      const farmer = await api.getFarmerByPhone(mobile);
      updateFarmer(farmer);
    } catch {
      updateFarmer({
        farmerId: '',
        mobile,
        name: '—',
        status: 'Pending',
        addedAt: new Date().toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  function statusInfo(s: DocUploadStatus): { label: string; color: string; bg: string } {
    switch (s) {
      case 'done': return { label: t('uploaded'), color: COLORS.secondary, bg: COLORS.secondaryLight };
      case 'uploading': return { label: 'Uploading…', color: COLORS.info, bg: COLORS.infoLight };
      case 'processing': return { label: t('processing'), color: COLORS.warning, bg: COLORS.warningLight };
      case 'error': return { label: t('failed'), color: COLORS.error, bg: COLORS.errorLight };
      case 'picking': return { label: 'Selecting…', color: COLORS.textMuted, bg: COLORS.borderLight };
      default: return { label: 'Not uploaded', color: COLORS.textMuted, bg: COLORS.borderLight };
    }
  }

  const docLabel = (d: typeof REQUIRED_DOCUMENTS[0]) =>
    state.lang === 'hi' ? d.labelHi : state.lang === 'mr' ? d.labelMr : d.label;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBox}>
          <Text style={styles.heroIcon}>📑</Text>
          <Text style={styles.heroTitle}>{t('registerTitle')}</Text>
          <Text style={styles.heroSub}>{t('registerSubtitle')}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{t('uploadDocs')}</Text>
            <Text style={styles.progressCount}>{doneCount} / {REQUIRED_DOCUMENTS.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(doneCount / REQUIRED_DOCUMENTS.length) * 100}%` as any }]} />
          </View>
        </View>

        <View style={styles.docList}>
          {REQUIRED_DOCUMENTS.map((doc) => {
            const ds = docStates[doc.id];
            const si = statusInfo(ds.status);
            const isBusy = ds.status === 'uploading' || ds.status === 'processing' || ds.status === 'picking';
            const isDone = ds.status === 'done';

            return (
              <View key={doc.id} style={[styles.docCard, isDone && styles.docCardDone]}>
                <View style={styles.docCardLeft}>
                  <Text style={styles.docIcon}>{doc.icon}</Text>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{docLabel(doc)}</Text>
                    <Text style={styles.docDesc} numberOfLines={2}>{doc.description}</Text>
                    <View style={[styles.statusChip, { backgroundColor: si.bg }]}>
                      <Text style={[styles.statusChipText, { color: si.color }]}>{si.label}</Text>
                    </View>
                    {ds.status === 'error' && ds.error && (
                      <Text style={styles.errorText}>{ds.error}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    isDone && styles.uploadBtnDone,
                    isBusy && styles.uploadBtnBusy,
                  ]}
                  onPress={() => pickAndUpload(doc.id)}
                  disabled={isBusy}
                >
                  {isBusy
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <Text style={styles.uploadBtnText}>
                        {isDone ? '↩' : ds.status === 'error' ? '↻' : '↑'}
                        {'\n'}
                        <Text style={styles.uploadBtnLabel}>
                          {isDone ? t('reUpload') : t('uploadDoc')}
                        </Text>
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {!allDone && (
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              📌 Upload all 5 documents to complete registration. Accepted formats: JPG, PNG, PDF.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, (!allDone || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allDone || submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>{allDone ? t('submitReg') : `Upload all documents to continue`}</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 20 },
  heroBox: { alignItems: 'center', marginBottom: 24 },
  heroIcon: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  heroSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  progressCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 20, ...SHADOW.sm,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.text },
  progressCount: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.primary },
  progressBar: { height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full, backgroundColor: COLORS.primary },
  docList: { gap: 12, marginBottom: 20 },
  docCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', ...SHADOW.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  docCardDone: { borderColor: COLORS.secondary },
  docCardLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  docIcon: { fontSize: 28, marginTop: 2 },
  docInfo: { flex: 1, gap: 4 },
  docName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  docDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, lineHeight: 16 },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, marginTop: 4 },
  statusChipText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  errorText: { fontSize: FONT_SIZE.xs, color: COLORS.error, marginTop: 2 },
  uploadBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14,
    paddingVertical: 10, alignItems: 'center', minWidth: 72, marginLeft: 8, marginTop: 2,
  },
  uploadBtnDone: { backgroundColor: COLORS.secondary },
  uploadBtnBusy: { backgroundColor: COLORS.warning },
  uploadBtnText: { color: COLORS.white, fontSize: 18, textAlign: 'center', lineHeight: 22 },
  uploadBtnLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  tipBox: {
    padding: 14, backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary, marginBottom: 16,
  },
  tipText: { fontSize: FONT_SIZE.sm, color: COLORS.primaryDark, lineHeight: 20 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md, marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: COLORS.border },
  submitBtnText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: '700' },
});
