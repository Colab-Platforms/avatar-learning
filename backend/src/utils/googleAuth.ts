import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    console.warn("[GoogleAuth] GOOGLE_CLIENT_ID not found in environment variables.");
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface GoogleProfile {
    googleId: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
}

// Verifies a Google Identity Services ID token and returns the signed-in profile.
export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
    if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google sign-in is not configured on the server.");
    }

    const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
        throw new Error("Invalid Google token.");
    }

    return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified ?? false,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profileImage: payload.picture,
    };
};
