"use client";

import { GoogleButton, Heading, LegalNote, TextLink, useFreshAuthErrors, useSignedInRedirect } from "../_components/ui";

/**
 * Account creation for the AI Adoption site. For now this is Google sign-up
 * only: the existing backend creates the account from the verified Google
 * profile (POST /auth/google). Email/password sign-up needs extra details the
 * backend currently requires (mobile, country, state, city), so it isn't
 * offered here yet.
 */
export default function AdoptionSignupPage() {
  useFreshAuthErrors();
  const signedIn = useSignedInRedirect();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Heading title="Create your account" subtitle="Sign up with your Google account to get started with Avatar." />
      {signedIn ? (
        <p style={{ margin: 0, color: "#a3abb5" }}>You&apos;re signed in. Taking you back…</p>
      ) : (
        <GoogleButton text="signup_with" />
      )}
      <LegalNote />
      <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
        Already have an account? <TextLink href="/adoption/login">Sign In</TextLink>
      </p>
    </div>
  );
}
