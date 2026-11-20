"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY, nextTheme, parseTheme, readTheme, writeTheme, type BusinessTheme } from "@/lib/businessTheme";

interface ThemeCtx {
  theme: BusinessTheme;
  toggle: () => void;
}
const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export const useBusinessTheme = () => useContext(Ctx);

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Owns the theme for the whole Business Admin tree and renders its root element. The attribute lives on THIS element,
 * never on <html>/<body>, so nothing outside /admin-adaption (including /admin) can be affected.
 * Starts dark (the default and the server render), then applies the saved preference on mount.
 */
export function BusinessThemeRoot({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<BusinessTheme>("dark");

  useEffect(() => {
    setTheme(readTheme(storage()));
    // Keep several tabs in step.
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setTheme(parseTheme(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = nextTheme(t);
      writeTheme(storage(), next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return (
    <Ctx.Provider value={value}>
      <div className="ba-root" data-ba-theme={theme}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

/** Sun/moon switch for the top header. */
export function ThemeToggle() {
  const { theme, toggle } = useBusinessTheme();
  const light = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={light}
      title={light ? "Switch to dark theme" : "Switch to light theme"}
      data-testid="theme-toggle"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
    >
      {light ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
