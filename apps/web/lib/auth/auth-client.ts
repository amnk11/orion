import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields<{
      user: {
        role: {
          type: "string";
        };
        facilityId: {
          type: "string";
        };
      };
    }>(),
  ],
});

export const { signIn, signOut, useSession, getSession } = authClient;
