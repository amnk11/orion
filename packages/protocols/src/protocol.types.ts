import { UrgencyLevel } from "@orion/domain";

export interface ProtocolField {
  id: string;
  type: "boolean" | "number" | "text" | "select" | "multiselect";
  label: string;
  required?: boolean;
  options?: string[];
}

export interface UrgencyRule {
  id: string;
  condition: {
    any_of?: string[];
    all_of?: string[];
    field_gte?: {
      field: string;
      value: number;
    };
  };
  urgency: UrgencyLevel;
  label: string;
}

export interface CompletenessRule {
  id: string;
  when_urgency?: UrgencyLevel[];
  required_fields: string[];
  message: string;
}

export interface ProtocolDefinition {
  code: string;
  name: string;
  version: string;
  fields: ProtocolField[];
  urgency_rules: UrgencyRule[];
  completeness_rules: CompletenessRule[];
}

export interface TriageResult {
  urgency: UrgencyLevel;
  matched_rules: string[];
  completeness: {
    missing: Array<{
      field: string;
      message: string;
    }>;
    is_complete: boolean;
  };
  can_submit: boolean;
}
