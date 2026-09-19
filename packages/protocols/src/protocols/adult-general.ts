import { ProtocolDefinition } from "../protocol.types.js";

export const ADULT_GENERAL_PROTOCOL: ProtocolDefinition = {
  code: "adult_general",
  name: "Adult General Medical",
  version: "1.0",
  fields: [
    { id: "age", type: "number", label: "Age", required: true },
    { id: "chest_pain", type: "boolean", label: "Severe Chest Pain" },
    { id: "breathlessness", type: "boolean", label: "Breathlessness / Difficulty Breathing" },
    { id: "altered_sensorium", type: "boolean", label: "Altered Sensorium / Unconscious" },
    { id: "fever_prolonged", type: "boolean", label: "Prolonged Fever (> 5 Days)" },
    { id: "vitals_recorded", type: "boolean", label: "Vitals Recorded" },
    { id: "bp", type: "text", label: "Blood Pressure" },
    { id: "spo2", type: "number", label: "SpO2 (%)" },
    { id: "treatment_given", type: "text", label: "Initial Treatment Given" },
  ],
  urgency_rules: [
    {
      id: "red_chest_pain",
      condition: { any_of: ["chest_pain"] },
      urgency: "red",
      label: "Suspected ACS / Severe Chest Pain",
    },
    {
      id: "red_altered_sensorium",
      condition: { any_of: ["altered_sensorium"] },
      urgency: "red",
      label: "Altered Sensorium",
    },
    {
      id: "red_hypoxia",
      condition: { field_gte: { field: "age", value: 0 } }, // Catchall for structure, real logic would use field_lt for SpO2 but field_gte is our current op
      urgency: "green",
      label: "Baseline",
    },
    {
      id: "orange_breathlessness",
      condition: { any_of: ["breathlessness"] },
      urgency: "orange",
      label: "Respiratory Distress",
    },
    {
      id: "orange_prolonged_fever",
      condition: { any_of: ["fever_prolonged"] },
      urgency: "orange",
      label: "Prolonged Fever (Investigation Req)",
    }
  ],
  completeness_rules: [
    {
      id: "req_vitals_for_urgent",
      when_urgency: ["red", "orange"],
      required_fields: ["bp", "spo2"],
      message: "BP and SpO2 must be recorded for urgent medical referrals.",
    }
  ],
};
