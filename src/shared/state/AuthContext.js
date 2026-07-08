import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthState, onAuthChange } from '../api/client';
import { loadAuth, saveAuth, clearAuth } from '../api/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    accessToken: null,
    refreshToken: null,
    role: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const stored = await loadAuth();
      if (stored?.refreshToken) {
        setAuthState({
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          role: stored.role,
        });
        try {
          const me = await api.get('/auth/me');
          const next = { ...stored, profile: me.profile, loading: false };
          setAuth(next);
          await saveAuth(next);
        } catch {
          await clearAuth();
          setAuth((s) => ({
            ...s,
            accessToken: null,
            refreshToken: null,
            role: null,
            profile: null,
            loading: false,
          }));
        }
      } else {
        setAuth((s) => ({ ...s, loading: false }));
      }
    })();

    onAuthChange(async (state) => {
      if (!state.accessToken) {
        await clearAuth();
        setAuth((s) => ({
          ...s,
          accessToken: null,
          refreshToken: null,
          role: null,
          profile: null,
        }));
      } else {
        setAuth((s) => {
          const next = { ...s, ...state };
          saveAuth({
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
            role: next.role,
            profile: next.profile,
          });
          return next;
        });
      }
    });
  }, []);

  const finishLogin = async (data) => {
    setAuthState({
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      role: data.role,
    });
    const next = {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      role: data.role,
      profile: data.profile,
      loading: false,
    };
    setAuth(next);
    await saveAuth(next);
    return next;
  };

  const value = {
    ...auth,
    loginUser: async (email, password) =>
      finishLogin(await api.post('/auth/login/user', { email, password }, { auth: false })),
    loginAgent: async (email, password) =>
      finishLogin(await api.post('/auth/login/agent', { email, password }, { auth: false })),
    loginAdmin: async (email, password) =>
      finishLogin(await api.post('/auth/login/admin', { email, password }, { auth: false })),
    requestOtp: async (email, purpose) =>
      api.post('/auth/otp/request', purpose ? { email, purpose } : { email }, { auth: false }),
    // Signup "Continue": checks the email/phone and, when both are free, sends
    // the OTP in the same call. Returns { emailTaken, phoneTaken, otpSent }.
    checkAvailability: async ({ email, phone }) =>
      api.post('/auth/availability', { email, phone }, { auth: false }),
    verifyOtp: async (email, code) =>
      api.post('/auth/otp/verify', { email, code }, { auth: false }),
    resetPassword: async (email, password) =>
      api.post('/auth/password/reset', { email, password }, { auth: false }),
    // Change the signed-in user's login email — the new address must already be
    // OTP-verified (requestOtp purpose 'change-email' → verifyOtp).
    changeEmail: async (email) => api.patch('/users/me/email', { email }),
    register: async (payload) => {
      const data = await api.post('/auth/register', payload, { auth: false });
      // Business accounts come back pending (no tokens) — caller shows the
      // "awaiting approval" screen instead of entering the app.
      if (data.pending || !data.tokens) {
        return { pending: true, profile: data.profile };
      }
      return finishLogin({ ...data, role: 'user' });
    },
    // Create the account but do NOT sign in — used by the signup flow so the
    // user is redirected to the login screen after verifying their email.
    registerOnly: async (payload) => {
      await api.post('/auth/register', payload, { auth: false });
    },
    logout: async () => {
      const rt = auth.refreshToken;
      try {
        if (rt) await api.post('/auth/logout', { refreshToken: rt }, { auth: false });
      } catch {}
      setAuthState({ accessToken: null, refreshToken: null, role: null });
      await clearAuth();
      setAuth({
        accessToken: null,
        refreshToken: null,
        role: null,
        profile: null,
        loading: false,
      });
    },
    refreshProfile: async () => {
      const me = await api.get('/auth/me');
      setAuth((s) => {
        const next = { ...s, profile: me.profile };
        saveAuth({
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          role: next.role,
          profile: next.profile,
        });
        return next;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
