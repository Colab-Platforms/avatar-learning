import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import apiClient from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNo: string | null;
  state: string | null;
  country: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingEmail: string | null;
  pendingOtpType: "REGISTER" | "LOGIN" | null;
  loading: boolean;
  error: string | null;
}

// ─── Backend response envelope ────────────────────────────────────────────────

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "auth";

function persist(user: AuthUser, accessToken: string, refreshToken: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
  } catch { /* SSR / private browsing — fail silently */ }
}

function hydrate(): Pick<AuthState, "user" | "accessToken" | "refreshToken"> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Error extractor ──────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message;
  }
  return (err as Error).message ?? "Something went wrong";
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phoneNo: string;
      state: string;
      country: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data: res } = await apiClient.post<ApiResponse<null>>(
        "/auth/register",
        data
      );
      return { message: res.message, email: data.email };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data: res } = await apiClient.post<
        ApiResponse<{
          user?: AuthUser;
          accessToken?: string;
          refreshToken?: string;
          requiresVerification?: boolean;
        }>
      >("/auth/login", data);
      return { ...res.data, email: data.email };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (
    data: { email: string; otp: string; type: "REGISTER" | "LOGIN" },
    { rejectWithValue }
  ) => {
    try {
      const { data: res } = await apiClient.post<
        ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>
      >("/auth/verify-otp", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (data: { email: string; type: "REGISTER" | "LOGIN" }, { rejectWithValue }) => {
    try {
      await apiClient.post("/auth/resend-otp", data);
      return true;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

/** Calls POST /auth/logout to invalidate the session, then wipes local state. */
export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    try {
      if (auth.refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken: auth.refreshToken });
      }
    } catch { /* network error — still clear locally */ }
    clearStorage();
  }
);

// ─── Initial state (rehydrated from localStorage) ────────────────────────────

const { user, accessToken, refreshToken } = hydrate();

const initialState: AuthState = {
  user:           user        ?? null,
  accessToken:    accessToken ?? null,
  refreshToken:   refreshToken ?? null,
  pendingEmail:   null,
  pendingOtpType: null,
  loading:        false,
  error:          null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Instant client-side logout — clears state + storage, no API call. */
    logout(state) {
      state.user           = null;
      state.accessToken    = null;
      state.refreshToken   = null;
      state.pendingEmail   = null;
      state.pendingOtpType = null;
      state.error          = null;
      clearStorage();
    },
    clearError(state) {
      state.error = null;
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken  = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    // ── register ──────────────────────────────────────────────────────────────
    builder
      .addCase(register.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading        = false;
        state.pendingEmail   = action.payload.email;
        state.pendingOtpType = "REGISTER";
      })
      .addCase(register.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── login ─────────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresVerification) {
          state.pendingEmail   = action.payload.email;
          state.pendingOtpType = "LOGIN";
        } else if (action.payload.user && action.payload.accessToken && action.payload.refreshToken) {
          state.user           = action.payload.user;
          state.accessToken    = action.payload.accessToken;
          state.refreshToken   = action.payload.refreshToken;
          state.pendingEmail   = null;
          state.pendingOtpType = null;
          persist(action.payload.user, action.payload.accessToken, action.payload.refreshToken);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── verifyOtp ─────────────────────────────────────────────────────────────
    builder
      .addCase(verifyOtp.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading        = false;
        state.user           = action.payload.user;
        state.accessToken    = action.payload.accessToken;
        state.refreshToken   = action.payload.refreshToken;
        state.pendingEmail   = null;
        state.pendingOtpType = null;
        persist(action.payload.user, action.payload.accessToken, action.payload.refreshToken);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── resendOtp ─────────────────────────────────────────────────────────────
    builder
      .addCase(resendOtp.pending,  (state) => { state.error = null; })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // ── logoutThunk ───────────────────────────────────────────────────────────
    builder
      .addCase(logoutThunk.pending,   (state) => { state.loading = true; })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading        = false;
        state.user           = null;
        state.accessToken    = null;
        state.refreshToken   = null;
        state.pendingEmail   = null;
        state.pendingOtpType = null;
        state.error          = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Clear everything regardless
        state.loading        = false;
        state.user           = null;
        state.accessToken    = null;
        state.refreshToken   = null;
        state.error          = null;
        clearStorage();
      });
  },
});

export const { logout, clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;
