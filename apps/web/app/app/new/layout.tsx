"use client";

import { ReferralDraftProvider } from "./components/referral-draft-context";

export default function NewReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReferralDraftProvider>
      <div className="max-w-3xl mx-auto w-full py-8 px-4">
        {children}
      </div>
    </ReferralDraftProvider>
  );
}
