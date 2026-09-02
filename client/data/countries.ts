import { useEffect, useState } from "react";
import type { Country as CountryT, State as StateT, City as CityT } from "country-state-city";

export interface CountryOption {
  isoCode: string;
  name: string;
}

export interface StateOption {
  isoCode: string;
  name: string;
}

export interface CityOption {
  name: string;
}

// Business is India-first, so India is the default selection — but every
// country is selectable, and its states/UTs load in based on that pick.
export const DEFAULT_COUNTRY_CODE = "IN";

// `country-state-city` ships a full world city dataset (~17MB installed) —
// it's only needed on the handful of forms below, so it's loaded on demand
// instead of bundled into every page's initial JS.
type CSCModule = { Country: typeof CountryT; State: typeof StateT; City: typeof CityT };
let cache: CSCModule | null = null;
let loadingPromise: Promise<CSCModule> | null = null;

export function preloadCountryData(): Promise<CSCModule> {
  if (cache) return Promise.resolve(cache);
  if (!loadingPromise) {
    loadingPromise = import("country-state-city").then((mod) => {
      cache = { Country: mod.Country, State: mod.State, City: mod.City };
      return cache;
    });
  }
  return loadingPromise;
}

/** Triggers the lazy load on mount and re-renders once the dataset is ready. */
export function useCountryDataReady(): boolean {
  const [ready, setReady] = useState(!!cache);
  useEffect(() => {
    if (cache) {
      setReady(true);
      return;
    }
    let active = true;
    preloadCountryData().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return ready;
}

export const getCountries = (): CountryOption[] => {
  if (!cache) return [];
  return cache.Country.getAllCountries()
    .map((c) => ({ isoCode: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getStatesForCountry = (countryCode: string): StateOption[] => {
  if (!cache || !countryCode) return [];
  return cache.State.getStatesOfCountry(countryCode)
    .map((s) => ({ isoCode: s.isoCode, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getCitiesForState = (
  countryCode: string,
  stateCode: string,
): CityOption[] => {
  if (!cache || !countryCode || !stateCode) return [];
  return cache.City.getCitiesOfState(countryCode, stateCode)
    .map((c) => ({ name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getCountryIsoCode = (name: string): string => {
  if (!cache || !name) return "";
  const found = cache.Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return found ? found.isoCode : "";
};

export const getStateIsoCode = (
  countryIsoCode: string,
  name: string,
): string => {
  if (!cache || !countryIsoCode || !name) return "";
  const found = cache.State.getStatesOfCountry(countryIsoCode).find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
  return found ? found.isoCode : "";
};
