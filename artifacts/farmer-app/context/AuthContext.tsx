import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { setAuthToken, apiRequest } from "@/lib/query-client";

export interface FarmerProfile {
  farmerId: string;
  mobile: string;
  name: string;
  status: "Pending" | "Active" | "Inactive" | "Rejected";
  district?: string;
  village?: string;
  taluka?: string;
  land?: string | number;
  crop?: string;
  aadhaar?: string;
  bankAccount?: string;
  bankName?: string;
  ifsc?: string;
  dob?: string;
  gender?: string;
  address?: string;
  surveyNumber?: string;
  source?: string;
  addedAt?: string;
  docs?: Array<{ name: string; status: string; section: string }>;
}

interface AuthContextType {
  token: string | null;
  mobile: string | null;
  farmer: FarmerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobile: string, token: string, farmer: FarmerProfile | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshFarmer: () => Promise<void>;
  updateFarmer: (data: Partial<FarmerProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "kisan_auth_token";
const MOBILE_KEY = "kisan_mobile";

async function storeSecure(key: string, value: string) {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteSecure(key: string) {
  if (Platform.OS === "web") {
    try { localStorage.removeItem(key); } catch {}
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getSecure(TOKEN_KEY);
        const storedMobile = await getSecure(MOBILE_KEY);
        if (storedToken && storedMobile) {
          setToken(storedToken);
          setMobile(storedMobile);
          setAuthToken(storedToken);
          try {
            const data = await apiRequest<FarmerProfile | null>(
              "GET",
              `/farmers/by-phone/${storedMobile}`,
            );
            setFarmer(data);
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (mob: string, tok: string, farmerData: FarmerProfile | null) => {
    await storeSecure(TOKEN_KEY, tok);
    await storeSecure(MOBILE_KEY, mob);
    setAuthToken(tok);
    setToken(tok);
    setMobile(mob);
    setFarmer(farmerData);
  }, []);

  const logout = useCallback(async () => {
    await deleteSecure(TOKEN_KEY);
    await deleteSecure(MOBILE_KEY);
    setAuthToken(null);
    setToken(null);
    setMobile(null);
    setFarmer(null);
  }, []);

  const refreshFarmer = useCallback(async () => {
    if (!mobile) return;
    try {
      const data = await apiRequest<FarmerProfile | null>("GET", `/farmers/by-phone/${mobile}`);
      setFarmer(data);
    } catch {}
  }, [mobile]);

  const updateFarmer = useCallback((data: Partial<FarmerProfile>) => {
    setFarmer((prev) => (prev ? { ...prev, ...data } : (data as FarmerProfile)));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        mobile,
        farmer,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        refreshFarmer,
        updateFarmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
