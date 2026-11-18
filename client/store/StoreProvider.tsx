"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateAuth } from "@/store/authSlice";

const STORAGE_KEY = "auth";

function AuthHydrator() {
  useEffect(() => {
    let user = null, accessToken = null, refreshToken = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) ({ user = null, accessToken = null, refreshToken = null } = JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    // Always dispatch, even when nothing is stored, so `hasHydrated` flips
    // to true and pages relying on redux `user` know it's safe to redirect.
    store.dispatch(hydrateAuth({ user, accessToken, refreshToken }));
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
