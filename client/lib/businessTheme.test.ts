// Run with: npm run test:logic
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_THEME, THEME_KEY, nextTheme, parseTheme, readTheme, writeTheme } from "./businessTheme";

const memory = (initial: Record<string, string> = {}) => {
  const m = new Map(Object.entries(initial));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("business admin theme preference", () => {
  it("dark is the default, and anything unrecognised falls back to it", () => {
    assert.equal(DEFAULT_THEME, "dark");
    for (const v of [null, undefined, "", "blue", "LIGHT", 1, {}]) assert.equal(parseTheme(v), "dark");
    assert.equal(parseTheme("light"), "light");
    assert.equal(parseTheme("dark"), "dark");
  });

  it("toggles between the two themes", () => {
    assert.equal(nextTheme("dark"), "light");
    assert.equal(nextTheme("light"), "dark");
  });

  it("persists across reloads: what was written is read back", () => {
    const s = memory();
    assert.equal(readTheme(s), "dark");
    assert.equal(writeTheme(s, "light"), true);
    assert.equal(s.m.get(THEME_KEY), "light");
    assert.equal(readTheme(s), "light");
    writeTheme(s, "dark");
    assert.equal(readTheme(s), "dark");
  });

  it("a corrupted stored value is ignored", () => {
    assert.equal(readTheme(memory({ [THEME_KEY]: "<script>" })), "dark");
  });

  it("never throws when storage is unavailable or blocked", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    assert.equal(readTheme(throwing), "dark");
    assert.equal(writeTheme(throwing, "light"), false);
    assert.equal(readTheme(null), "dark");
    assert.equal(writeTheme(undefined, "light"), false);
  });

  it("uses a Business Admin specific key so no other part of the site reads it", () => {
    assert.equal(THEME_KEY, "ba-theme");
  });
});
