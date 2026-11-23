// Which site the visitor is browsing: AI Adoption (dark) or Avatar Learning (light).
// Shared pages (/investors/*, the legal pages) render in the style of the site the
// visitor came from. Every page view outside those shared pages records the site
// (DeferredWidgets does this), so the choice never has to travel in the URL.
//
// Stored per tab in sessionStorage (so back/forward and refresh keep it) and mirrored
// to localStorage so a new tab or a later visit starts from the last site used.
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type Site = "adoption" | "learning";

export const SITE_KEY = "avatar-last-site";
const CHANGE_EVENT = "avatar-site-change";

function parse(v: string | null): Site | null {
  return v === "adoption" || v === "learning" ? v : null;
}

export function getLastSite(): Site | null {
  try {
    return parse(sessionStorage.getItem(SITE_KEY)) ?? parse(localStorage.getItem(SITE_KEY));
  } catch {
    return null;
  }
}

export function setLastSite(site: Site) {
  try {
    if (sessionStorage.getItem(SITE_KEY) === site && localStorage.getItem(SITE_KEY) === site) return;
    sessionStorage.setItem(SITE_KEY, site);
    localStorage.setItem(SITE_KEY, site);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Old links carried the site as ?theme=dark (Adoption) / ?theme=light (Learning). */
export function siteFromThemeParam(value: string | null): Site | null {
  return value === "dark" ? "adoption" : value === "light" ? "learning" : null;
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Site to style a shared page as. `undefined` until it can be read on the client
 * (render a neutral placeholder then, never a guessed theme); "learning" when the
 * visitor has no recorded site (a direct visit), which is how these pages behaved
 * before this was added.
 */
export function useSharedPageSite(): Site | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getLastSite() ?? "learning",
    () => undefined,
  );
}

/**
 * Dark (AI Adoption) or light (Avatar Learning) styling for the shared /investors pages.
 * A legacy ?theme= link is honoured once: its choice is saved, then the parameter is
 * removed from the address bar (the page keeps the same look because the saved value
 * now matches). `undefined` until known. Needs a Suspense boundary (useSearchParams).
 */
export function useSharedPageDark(): boolean | undefined {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const legacy = siteFromThemeParam(searchParams.get("theme"));
  const stored = useSharedPageSite();

  useEffect(() => {
    if (!searchParams.has("theme")) return;
    if (legacy) setLastSite(legacy);
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete("theme");
    const q = rest.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [legacy, pathname, router, searchParams]);

  const site = legacy ?? stored;
  return site === undefined ? undefined : site === "adoption";
}
