// client/src/state/auth.jsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ACCESS_KEY = "talenttrack_access_token";
const REFRESH_KEY = "talenttrack_refresh_token";

/**
 * Backend base URL
 * Set in: client/.env
 * VITE_API_BASE_URL="http://localhost:8080"
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/** ------------------ LocalStorage helpers ------------------ */
function getTokens() {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken) return null;
  return { accessToken, refreshToken: refreshToken || null };
}
function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
}
function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** ------------------ Axios client (single instance) ------------------ */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;

function setInMemoryTokens({ accessToken, refreshToken }) {
  inMemoryAccessToken = accessToken || null;
  inMemoryRefreshToken = refreshToken || null;
}

/** Attach access token automatically */
api.interceptors.request.use((config) => {
  if (inMemoryAccessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});

/**
 * Refresh-once logic:
 * - If a request returns 401, try refresh exactly once
 * - If refresh succeeds → retry original request
 * - If refresh fails → logout
 */
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, newAccessToken) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Not an auth error or already retried
    if (err?.response?.status !== 401 || original?._retry) {
      throw err;
    }

    // No refresh token available → hard fail
    if (!inMemoryRefreshToken) {
      throw err;
    }

    // If refresh already in progress, wait for it then retry
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            original._retry = true;
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject
        });
      });
    }

    // Start refresh
    original._retry = true;
    isRefreshing = true;

    try {
      const refreshRes = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: inMemoryRefreshToken },
        { timeout: 20000 }
      );

      const newAccessToken = refreshRes.data?.accessToken;
      const newRefreshToken = refreshRes.data?.refreshToken || inMemoryRefreshToken;

      if (!newAccessToken) throw new Error("Refresh did not return accessToken");

      setInMemoryTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
      setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

      resolveQueue(null, newAccessToken);

      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshErr) {
      resolveQueue(refreshErr, null);
      clearTokens();
      setInMemoryTokens({ accessToken: null, refreshToken: null });
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }
);

/** ------------------ Auth Context ------------------ */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null); // { id, name, email, role }
  const bootstrappedRef = useRef(false);

  const isAuthed = !!user;

  async function bootstrap() {
    // Prevent double bootstrap (React StrictMode runs effects twice in dev)
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    try {
      const tokens = getTokens();
      if (!tokens?.accessToken) {
        setUser(null);
        setIsReady(true);
        return;
      }

      setInMemoryTokens(tokens);

      const me = await api.get("/me");
      setUser(me.data?.user || null);
    } catch (e) {
      clearTokens();
      setInMemoryTokens({ accessToken: null, refreshToken: null });
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }

  async function login(email, password) {
    const tId = toast.loading("Signing in...");
    try {
      const res = await api.post("/auth/login", { email, password });
      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken || null;
      const u = res.data?.user;

      if (!accessToken || !u) throw new Error("Invalid login response");

      setTokens({ accessToken, refreshToken });
      setInMemoryTokens({ accessToken, refreshToken });
      setUser(u);

      toast.success("Welcome back!", { id: tId });
      return u;
    } catch (e) {
      toast.error(e?.response?.data?.error || "Login failed", { id: tId });
      throw e;
    }
  }

  /**
   * Signup flow (OTP)
   * Step 1: requestOtp({name,email,password})
   * Backend sends OTP via SMTP
   */
  async function requestOtp({ name, email, password }) {
    const tId = toast.loading("Sending OTP...");
    try {
      await api.post("/auth/signup", { name, email, password });
      toast.success("OTP sent to your email", { id: tId });
      return true;
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to send OTP", { id: tId });
      throw e;
    }
  }

  /**
   * Step 2: verifyOtp({email, otp})
   * Backend verifies OTP and creates account + returns tokens
   */
  async function verifyOtp({ email, otp }) {
    const tId = toast.loading("Verifying OTP...");
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });

      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken || null;
      const u = res.data?.user;

      if (!accessToken || !u) throw new Error("Invalid verify response");

      setTokens({ accessToken, refreshToken });
      setInMemoryTokens({ accessToken, refreshToken });
      setUser(u);

      toast.success("Account verified!", { id: tId });
      return u;
    } catch (e) {
      toast.error(e?.response?.data?.error || "OTP verification failed", { id: tId });
      throw e;
    }
  }

  async function logout() {
    // optional backend logout endpoint (not required)
    clearTokens();
    setInMemoryTokens({ accessToken: null, refreshToken: null });
    setUser(null);
    toast.success("Logged out");
  }

  async function refreshMe() {
    const me = await api.get("/me");
    setUser(me.data?.user || null);
    return me.data?.user || null;
  }

  const value = useMemo(
    () => ({
      api, // expose api so screens can call backend easily
      isReady,
      isAuthed,
      user,
      role: user?.role || "user",
      bootstrap,
      login,
      requestOtp,
      verifyOtp,
      logout,
      refreshMe
    }),
    [isReady, isAuthed, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
