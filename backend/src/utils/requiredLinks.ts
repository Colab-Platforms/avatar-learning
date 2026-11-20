import { ApiError } from "./ApiError.js";
import STATUS_CODES from "./statusCodes.js";

type Env = Record<string, string | undefined>;

/** Thrown when a required configuration value (e.g. an invite link) is missing or invalid. */
export class MissingConfigError extends ApiError {
  readonly code = "CONFIG_NOT_SET";
  readonly variable: string;
  constructor(variable: string) {
    super(`${variable} is not configured (or is not a valid http(s) URL).`, STATUS_CODES.SERVICE_UNAVAILABLE);
    this.variable = variable;
    Object.setPrototypeOf(this, MissingConfigError.prototype);
  }
}

const isHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Reads a required link from the environment at call time (never at import).
 * Missing, blank or non-http(s) values throw MissingConfigError, so an email
 * can never be built with an empty or bogus link.
 */
export const getRequiredLink = (name: string, env: Env = process.env): string => {
  const value = env[name]?.trim();
  if (!value || !isHttpUrl(value)) throw new MissingConfigError(name);
  return value;
};

/** Names (never values) of the required links that are unusable. */
export const missingRequiredLinks = (names: string[], env: Env = process.env): string[] =>
  names.filter((n) => {
    try {
      getRequiredLink(n, env);
      return false;
    } catch {
      return true;
    }
  });
