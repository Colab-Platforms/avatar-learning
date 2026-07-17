"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAppDispatch } from "@/store/hooks";
import { googleLogin, clearError } from "@/store/authSlice";

interface GoogleAuthButtonProps {
  referralCode?: string;
}

export function GoogleAuthButton({ referralCode }: GoogleAuthButtonProps) {
  const dispatch = useAppDispatch();

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    dispatch(clearError());
    dispatch(googleLogin({
      idToken: credentialResponse.credential,
      ...(referralCode ? { referralCode } : {}),
    }));
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error("Google sign-in failed")}
        theme="outline"
        shape="pill"
        width="320"
      />
    </div>
  );
}
