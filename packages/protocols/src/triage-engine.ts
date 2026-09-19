import { UrgencyLevel } from "@orion/domain";
import {
  ProtocolDefinition,
  TriageResult,
  UrgencyRule,
  CompletenessRule
} from "./protocol.types.js";

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  red: 3,
  orange: 2,
  green: 1,
};

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function evaluateRuleCondition(
  rule: UrgencyRule,
  formData: Record<string, unknown>
): boolean {
  const { any_of, all_of, field_gte } = rule.condition;

  if (any_of && any_of.length > 0) {
    if (any_of.some((field) => formData[field] === true)) {
      return true;
    }
  }

  if (all_of && all_of.length > 0) {
    if (all_of.every((field) => formData[field] === true)) {
      return true;
    }
  }

  if (field_gte) {
    const value = formData[field_gte.field];
    if (typeof value === "number" && value >= field_gte.value) {
      return true;
    }
  }

  return false;
}

export function evaluateProtocol(
  protocol: ProtocolDefinition,
  formData: Record<string, unknown>
): TriageResult {
  let highestUrgency: UrgencyLevel = "green";
  const matchedRules: string[] = [];

  // Evaluate Urgency
  for (const rule of protocol.urgency_rules) {
    if (evaluateRuleCondition(rule, formData)) {
      matchedRules.push(rule.id);
      
      if (URGENCY_RANK[rule.urgency] > URGENCY_RANK[highestUrgency]) {
        highestUrgency = rule.urgency;
      }
    }
  }

  // Evaluate Completeness
  const missing: Array<{ field: string; message: string }> = [];

  for (const rule of protocol.completeness_rules) {
    // Only apply rule if when_urgency matches, or if there's no when_urgency filter
    if (
      !rule.when_urgency ||
      rule.when_urgency.includes(highestUrgency)
    ) {
      for (const field of rule.required_fields) {
        if (isMissing(formData[field])) {
          // Prevent duplicates if multiple rules require the same field
          if (!missing.some((m) => m.field === field)) {
            missing.push({
              field,
              message: rule.message,
            });
          }
        }
      }
    }
  }

  // Base field requirements check (from ProtocolField definition)
  for (const field of protocol.fields) {
    if (field.required && isMissing(formData[field.id])) {
      if (!missing.some((m) => m.field === field.id)) {
        missing.push({
          field: field.id,
          message: `${field.label} is required.`,
        });
      }
    }
  }

  const isComplete = missing.length === 0;

  return {
    urgency: highestUrgency,
    matched_rules: matchedRules,
    completeness: {
      missing,
      is_complete: isComplete,
    },
    can_submit: isComplete,
  };
}
