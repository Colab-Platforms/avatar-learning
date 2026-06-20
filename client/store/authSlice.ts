import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import apiClient from "@/lib/apiClient";
import { ApiResponse } from "@/types/index";

export interface AuthUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNo: string | null;
  address: string | null;
  gender: string | null;
  profileImage: string | null;
  currentStudyLevel: string | null;
  state: string | null;
  country: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateUserBody {
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  address?: string;
  gender?: string;
  state?: string;
  country?: string;
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

const STORAGE_KEY = "auth";

function persist(
  user: AuthUser,
  accessToken: string,
  refreshToken: string
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user,
        accessToken,
        refreshToken,
      })
    );
  } catch(error) {
    console.error("Failed to persist auth to localStorage", error);
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch(error) {
    console.error("Failed to clear auth from localStorage", error);
  }
}

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message;
  }
  return (err as Error).message ?? "Something went wrong";
}

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

      return {
        message: res.message,
        email: data.email,
      };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (
    data: {
      email: string;
      password: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data: res } = await apiClient.post<
        ApiResponse<{
          user?: AuthUser;
          accessToken?: string;
          refreshToken?: string;
          requiresVerification?: boolean;
        }>
      >("/auth/login", data);

      return {
        ...res.data,
        email: data.email,
      };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (
    data: {
      email: string;
      otp: string;
      type: "REGISTER" | "LOGIN";
    },
    { rejectWithValue }
  ) => {
    try {
      const { data: res } = await apiClient.post<
        ApiResponse<{
          user: AuthUser;
          accessToken: string;
          refreshToken: string;
        }>
      >("/auth/verify-otp", data);

      return res.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (
    data: {
      email: string;
      type: "REGISTER" | "LOGIN";
    },
    { rejectWithValue }
  ) => {
    try {
      await apiClient.post("/auth/resend-otp", data);
      return true;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logoutThunk",
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };

    try {
      if (auth.refreshToken) {
        await apiClient.post("/auth/logout", {
          refreshToken: auth.refreshToken,
        });
      }
    } catch (error) {
      console.error("Failed to logout", error);
    }

    clearStorage();
  }
);

export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (
    data: UpdateUserBody & { id: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...body } = data;
      const { data: res } = await apiClient.put<ApiResponse<AuthUser>>(
        `/users/${id}`,
        body
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  pendingEmail: null,
  pendingOtpType: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    hydrateAuth(
      state,
      action: PayloadAction<{
        user: AuthUser | null;
        accessToken: string | null;
        refreshToken: string | null;
      }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.pendingEmail = null;
      state.pendingOtpType = null;
      state.error = null;

      clearStorage();
    },

    clearError(state) {
      state.error = null;
    },

    setTokens(
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },

  extraReducers: (builder) => {
    builder

      // REGISTER
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingEmail = action.payload.email;
        state.pendingOtpType = "REGISTER";
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.requiresVerification) {
          state.pendingEmail = action.payload.email;
          state.pendingOtpType = "LOGIN";
        } else if (
          action.payload.user &&
          action.payload.accessToken &&
          action.payload.refreshToken
        ) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.pendingEmail = null;
          state.pendingOtpType = null;

          persist(
            action.payload.user,
            action.payload.accessToken,
            action.payload.refreshToken
          );
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // VERIFY OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;

        state.pendingEmail = null;
        state.pendingOtpType = null;

        persist(
          action.payload.user,
          action.payload.accessToken,
          action.payload.refreshToken
        );
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // RESEND OTP
      .addCase(resendOtp.pending, (state) => {
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const { accessToken, refreshToken } = JSON.parse(stored);
              persist(state.user, accessToken, refreshToken);
            }
          } catch { /* ignore */ }
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // LOGOUT
      .addCase(logoutThunk.pending, (state) => {        state.loading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false;

        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.pendingEmail = null;
        state.pendingOtpType = null;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.loading = false;

        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null;

        clearStorage();
      });
  },
});

export const {
  hydrateAuth,
  logout,
  clearError,
  setTokens,
} = authSlice.actions;

export default authSlice.reducer;