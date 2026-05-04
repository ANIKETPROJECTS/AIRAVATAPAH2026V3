import AsyncStorage from "@react-native-async-storage/async-storage";

const UPLOAD_STATE_KEY = "farmer_upload_state";

export interface DocUploadStatus {
  docId: string;
  requestId: string | null;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  errorMsg?: string;
  uploadedAt?: string;
}

export async function getUploadState(mobile: string): Promise<DocUploadStatus[]> {
  try {
    const raw = await AsyncStorage.getItem(`${UPLOAD_STATE_KEY}_${mobile}`);
    if (!raw) return [];
    return JSON.parse(raw) as DocUploadStatus[];
  } catch {
    return [];
  }
}

export async function saveUploadState(mobile: string, state: DocUploadStatus[]): Promise<void> {
  await AsyncStorage.setItem(`${UPLOAD_STATE_KEY}_${mobile}`, JSON.stringify(state));
}

export async function clearUploadState(mobile: string): Promise<void> {
  await AsyncStorage.removeItem(`${UPLOAD_STATE_KEY}_${mobile}`);
}
