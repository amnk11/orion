export const ClinicalDictionary = {
  events: {
    HANDOFF_CREATED: "Referral created",
    HANDOFF_SENT: "Referral dispatched",
    HANDOFF_VIEWED: "Referral viewed by destination",
    CANNOT_ACCEPT: "Destination unable to accept",
    HANDOFF_REDIRECTED: "Referral auto-redirected",
    HANDOFF_ACCEPTED: "Referral accepted",
    PATIENT_ARRIVED: "Patient arrived at destination",
    RETURN_NOTE_ADDED: "Clinical loop closed (Return note)",
  } as Record<string, string>,

  status: {
    draft: "Draft",
    sent: "Dispatched",
    acknowledged: "Acknowledged",
    accepted: "Accepted",
    redirected: "Redirected",
    cannot_accept: "Unable to Accept",
    arrived: "Patient Arrived",
    in_care: "In Care",
    no_show: "No Show",
    outcome_recorded: "Outcome Recorded",
    closed: "Closed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  } as Record<string, string>,
  
  fields: {
    // Vitals
    bp: { label: "Blood pressure", category: "vitals", unit: "mmHg" },
    spo2: { label: "SpO₂", category: "vitals", unit: "%" },
    heart_rate: { label: "Heart rate", category: "vitals", unit: "bpm" },
    temperature: { label: "Temperature", category: "vitals", unit: "°C" },
    respiratory_rate: { label: "Respiratory rate", category: "vitals", unit: "rpm" },
    
    // Critical / Danger Signs
    bleeding: { label: "Vaginal Bleeding", category: "critical" },
    severe_headache: { label: "Severe Headache", category: "critical" },
    convulsion: { label: "Convulsions (Fits)", category: "critical" },
    chest_pain: { label: "Severe Chest Pain", category: "critical" },
    altered_sensorium: { label: "Altered Sensorium / Unconscious", category: "critical" },
    reduced_movements: { label: "Reduced Fetal Movements", category: "critical" },
    breathlessness: { label: "Respiratory Distress", category: "critical" },
    fever: { label: "High Fever", category: "critical" },
    fever_prolonged: { label: "Prolonged Fever", category: "symptoms" },

    // Metadata / Context
    gestation_weeks: { label: "Gestation", category: "context", unit: "weeks" },
    age: { label: "Age", category: "context", unit: "years" },
    
    // Additional Findings & Operational
    already_done: { label: "Treatment Given", category: "additional" },
    treatment_given: { label: "Initial Treatment", category: "additional" },
    request: { label: "Specific Request", category: "additional" },
    esanjeevani_ticket: { label: "eSanjeevani Ticket ID", category: "additional" },
    transport_required: { label: "Ambulance Required", category: "operational" },
    transport_ref: { label: "Ambulance Reference", category: "operational" },
    vitals_recorded: { label: "Vitals Recorded", category: "operational" },
  } as Record<string, { label: string; category: string; unit?: string }>,

  formatEvent: (event: string) => {
    return ClinicalDictionary.events[event] || event.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  },

  formatStatus: (status: string) => {
    return ClinicalDictionary.status[status.toLowerCase()] || status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
};
