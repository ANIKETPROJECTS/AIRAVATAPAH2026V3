import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Farmer, Lang } from '../types';
import { storage } from '../storage';
import { api } from '../api';

interface AuthState {
  loading: boolean;
  token: string | null;
  mobile: string | null;
  farmer: Farmer | null;
  lang: Lang;
}

type AuthAction =
  | { type: 'INIT'; payload: { token: string | null; mobile: string | null; farmer: Farmer | null; lang: Lang } }
  | { type: 'LOGIN'; payload: { token: string; mobile: string; farmer: Farmer | null } }
  | { type: 'UPDATE_FARMER'; payload: Farmer | null }
  | { type: 'SET_LANG'; payload: Lang }
  | { type: 'LOGOUT' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT':
      return { loading: false, ...action.payload };
    case 'LOGIN':
      return { ...state, loading: false, ...action.payload };
    case 'UPDATE_FARMER':
      return { ...state, farmer: action.payload };
    case 'SET_LANG':
      return { ...state, lang: action.payload };
    case 'LOGOUT':
      return { loading: false, token: null, mobile: null, farmer: null, lang: state.lang };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (token: string, mobile: string, farmer: Farmer | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshFarmer: () => Promise<void>;
  updateFarmer: (farmer: Farmer | null) => void;
  setLang: (lang: Lang) => void;
}

const AuthContext = createContext<AuthContextValue>({
  state: { loading: true, token: null, mobile: null, farmer: null, lang: 'en' },
  login: async () => {},
  logout: async () => {},
  refreshFarmer: async () => {},
  updateFarmer: () => {},
  setLang: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    token: null,
    mobile: null,
    farmer: null,
    lang: 'en',
  });

  useEffect(() => {
    (async () => {
      try {
        const [session, lang] = await Promise.all([
          storage.loadSession(),
          storage.loadLang(),
        ]);
        dispatch({
          type: 'INIT',
          payload: {
            token: session.token,
            mobile: session.mobile,
            farmer: session.farmer as Farmer | null,
            lang: (lang as Lang | null) ?? 'en',
          },
        });
      } catch {
        dispatch({
          type: 'INIT',
          payload: { token: null, mobile: null, farmer: null, lang: 'en' },
        });
      }
    })();
  }, []);

  const login = useCallback(async (token: string, mobile: string, farmer: Farmer | null) => {
    await storage.saveSession(token, mobile);
    if (farmer) await storage.saveFarmer(farmer);
    dispatch({ type: 'LOGIN', payload: { token, mobile, farmer } });
  }, []);

  const logout = useCallback(async () => {
    await storage.clearSession();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshFarmer = useCallback(async () => {
    if (!state.mobile) return;
    try {
      const farmer = await api.getFarmerByPhone(state.mobile);
      await storage.saveFarmer(farmer);
      dispatch({ type: 'UPDATE_FARMER', payload: farmer });
    } catch {
      dispatch({ type: 'UPDATE_FARMER', payload: null });
    }
  }, [state.mobile]);

  const updateFarmer = useCallback((farmer: Farmer | null) => {
    if (farmer) storage.saveFarmer(farmer).catch(() => {});
    dispatch({ type: 'UPDATE_FARMER', payload: farmer });
  }, []);

  const setLang = useCallback((lang: Lang) => {
    storage.saveLang(lang).catch(() => {});
    dispatch({ type: 'SET_LANG', payload: lang });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, refreshFarmer, updateFarmer, setLang }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
