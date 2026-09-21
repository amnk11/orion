"use client";

import * as React from "react";
import { createContext, useContext, useState } from "react";
import { UrgencyLevel } from "@orion/domain";

interface ReferralDraftState {
  patientId: string | null;
  patientName: string | null;
  patientAge: number | null;
  patientDetails: string | null;
  protocolCode: string | null;
  protocolInputs: Record<string, unknown>;
  destinationFacilityId: string | null;
  urgency: UrgencyLevel | null;
  isComplete: boolean;
}

interface ReferralDraftContextValue {
  draft: ReferralDraftState;
  setPatientId: (id: string, name?: string, age?: number | null, details?: string) => void;
  setProtocolCode: (code: string) => void;
  setProtocolInputs: (inputs: Record<string, unknown>, urgency: UrgencyLevel, isComplete: boolean) => void;
  setDestinationFacilityId: (id: string) => void;
  clearDraft: () => void;
}

const initialState: ReferralDraftState = {
  patientId: null,
  patientName: null,
  patientAge: null,
  patientDetails: null,
  protocolCode: null,
  protocolInputs: {},
  destinationFacilityId: null,
  urgency: null,
  isComplete: false,
};

const ReferralDraftContext = createContext<ReferralDraftContextValue | null>(null);

export function ReferralDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReferralDraftState>(initialState);

  const setPatientId = (id: string, name?: string, age?: number | null, details?: string) => 
    setDraft((prev) => ({ ...prev, patientId: id, patientName: name || null, patientAge: age ?? null, patientDetails: details || null }));
  const setProtocolCode = (code: string) => setDraft((prev) => ({ ...prev, protocolCode: code, protocolInputs: {}, urgency: null, isComplete: false }));
  const setProtocolInputs = (inputs: Record<string, unknown>, urgency: UrgencyLevel, isComplete: boolean) => 
    setDraft((prev) => ({ ...prev, protocolInputs: inputs, urgency, isComplete }));
  const setDestinationFacilityId = (id: string) => setDraft((prev) => ({ ...prev, destinationFacilityId: id }));
  const clearDraft = () => setDraft(initialState);

  return (
    <ReferralDraftContext.Provider
      value={{ draft, setPatientId, setProtocolCode, setProtocolInputs, setDestinationFacilityId, clearDraft }}
    >
      {children}
    </ReferralDraftContext.Provider>
  );
}

export function useReferralDraft() {
  const context = useContext(ReferralDraftContext);
  if (!context) {
    throw new Error("useReferralDraft must be used within a ReferralDraftProvider");
  }
  return context;
}
