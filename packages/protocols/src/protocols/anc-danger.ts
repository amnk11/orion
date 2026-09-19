import { ProtocolDefinition } from "../protocol.types.js";

export const ANC_DANGER_PROTOCOL: ProtocolDefinition = {
  code: "anc_danger",
  name: "ANC / Maternal Danger Signs",
  version: "1.0",
  fields: [
    { id: "gestation_weeks", type: "number", label: "Gestation (Weeks)", required: true },
    { id: "bleeding", type: "boolean", label: "Vaginal Bleeding" },
    { id: "severe_headache", type: "boolean", label: "Severe Headache / Blurred Vision" },
    { id: "convulsion", type: "boolean", label: "Convulsions (Fits)" },
    { id: "fever", type: "boolean", label: "High Fever" },
    { id: "reduced_movements", type: "boolean", label: "Reduced Fetal Movements" },
    { id: "bp", type: "text", label: "Blood Pressure" },
    { id: "already_done", type: "text", label: "Treatment Given" },
    { id: "request", type: "text", label: "Specific Request" },
    { id: "esanjeevani_ticket", type: "text", label: "eSanjeevani Ticket ID" },
    { id: "transport_required", type: "boolean", label: "Ambulance Required" },
    { id: "transport_ref", type: "text", label: "Ambulance Reference (if requested)" },
  ],
  urgency_rules: [
    {
      id: "red_bleeding",
      condition: { any_of: ["bleeding"] },
      urgency: "red",
      label: "Active Bleeding",
    },
    {
      id: "red_convulsion",
      condition: { any_of: ["convulsion"] },
      urgency: "red",
      label: "Convulsions",
    },
    {
      id: "orange_severe_headache",
      condition: { any_of: ["severe_headache"] },
      urgency: "orange",
      label: "Severe Headache (PIH Risk)",
    },
    {
      id: "orange_reduced_movements",
      condition: { any_of: ["reduced_movements"] },
      urgency: "orange",
      label: "Reduced Fetal Movements",
    },
    {
      id: "orange_fever",
      condition: { any_of: ["fever"] },
      urgency: "orange",
      label: "High Fever",
    },
  ],
  completeness_rules: [
    {
      id: "req_bp_for_danger",
      when_urgency: ["red", "orange"],
      required_fields: ["bp"],
      message: "Blood pressure must be recorded for danger signs.",
    }
  ],
};
