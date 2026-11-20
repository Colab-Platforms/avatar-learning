// Business Admin (/admin-adaption) theme preference. Pure helpers so the rules are unit-testable; the UI lives in
// components/business-admin/theme.tsx. The preference is applied to the Business Admin wrapper element only, never to
// <html> or <body>, so every other page (including the Learning Admin at /admin) is unaffected.

export type BusinessTheme = "dark" | "light";
export const THEME_KEY = "ba-theme";
export const DEFAULT_THEME: BusinessTheme = "dark";

export const parseTheme = (value: unknown): BusinessTheme => (value === "light" || value === "dark" ? value : DEFAULT_THEME);
export const nextTheme = (t: BusinessTheme): BusinessTheme => (t === "dark" ? "light" : "dark");

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Storage can throw (private mode, blocked cookies) or be absent (SSR): fall back to dark, never fail. */
export function readTheme(storage: StorageLike | null | undefined): BusinessTheme {
  try {
    return parseTheme(storage?.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function writeTheme(storage: StorageLike | null | undefined, theme: BusinessTheme): boolean {
  try {
    storage?.setItem(THEME_KEY, theme);
    return !!storage;
  } catch {
    return false;
  }
}
