"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateAuth } from "@/store/authSlice";

const STORAGE_KEY = "auth";

function AuthHydrator() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { user, accessToken, refreshToken } = JSON.parse(raw);
        store.dispatch(hydrateAuth({ user: user ?? null, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null }));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
}
