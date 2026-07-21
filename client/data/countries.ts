import { Country, State } from "country-state-city";

export interface CountryOption {
  isoCode: string;
  name: string;
}

export interface StateOption {
  isoCode: string;
  name: string;
}

// Business is India-first, so India is the default selection — but every
// country is selectable, and its states/UTs load in based on that pick.
export const DEFAULT_COUNTRY_CODE = "IN";

export const getCountries = (): CountryOption[] =>
  Country.getAllCountries()
    .map((c) => ({ isoCode: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const getStatesForCountry = (countryCode: string): StateOption[] =>
  State.getStatesOfCountry(countryCode)
    .map((s) => ({ isoCode: s.isoCode, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
