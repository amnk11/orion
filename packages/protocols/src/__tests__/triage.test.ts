import { describe, it, expect } from "vitest";
import { evaluateProtocol } from "../triage-engine.js";
import { ANC_DANGER_PROTOCOL } from "../protocols/anc-danger.js";
import { ADULT_GENERAL_PROTOCOL } from "../protocols/adult-general.js";

describe("Triage Engine - ANC Danger Protocol", () => {
  it("Default / no matching rule -> green", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 34,
      bleeding: false,
    });
    
    expect(result.urgency).toBe("green");
    expect(result.matched_rules.length).toBe(0);
    expect(result.can_submit).toBe(true);
  });

  it("ANC bleeding -> red", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 34,
      bleeding: true,
      bp: "120/80",
    });
    
    expect(result.urgency).toBe("red");
    expect(result.matched_rules).toContain("red_bleeding");
    expect(result.can_submit).toBe(true);
  });

  it("ANC convulsion -> red", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 38,
      convulsion: true,
      bp: "160/110",
    });
    
    expect(result.urgency).toBe("red");
    expect(result.matched_rules).toContain("red_convulsion");
  });

  it("ANC reduced movements -> orange", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 36,
      reduced_movements: true,
      bp: "120/80",
    });
    
    expect(result.urgency).toBe("orange");
    expect(result.matched_rules).toContain("orange_reduced_movements");
    expect(result.can_submit).toBe(true);
  });

  it("ANC fever -> orange", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 20,
      fever: true,
      bp: "110/70",
    });
    
    expect(result.urgency).toBe("orange");
    expect(result.matched_rules).toContain("orange_fever");
  });

  it("Multiple matches -> highest urgency wins", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 34,
      reduced_movements: true, // orange
      bleeding: true, // red
      bp: "100/60",
    });
    
    expect(result.urgency).toBe("red");
    expect(result.matched_rules).toContain("orange_reduced_movements");
    expect(result.matched_rules).toContain("red_bleeding");
  });

  it("Red without BP -> can_submit false", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 34,
      bleeding: true, // triggers red, missing BP
    });
    
    expect(result.urgency).toBe("red");
    expect(result.can_submit).toBe(false);
    expect(result.completeness.missing.some(m => m.field === "bp")).toBe(true);
  });

  it("Orange without BP -> can_submit false", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 24,
      fever: true, // triggers orange, missing BP
    });
    
    expect(result.urgency).toBe("orange");
    expect(result.can_submit).toBe(false);
    expect(result.completeness.missing.some(m => m.field === "bp")).toBe(true);
  });

  it("Red with required BP -> can_submit true", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 34,
      bleeding: true,
      bp: "110/70",
    });
    
    expect(result.urgency).toBe("red");
    expect(result.can_submit).toBe(true);
    expect(result.completeness.missing.length).toBe(0);
  });

  it("Missing gestation -> can_submit false (base required field)", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      // gestation_weeks omitted
      bleeding: false,
    });
    
    expect(result.can_submit).toBe(false);
    expect(result.completeness.missing.some(m => m.field === "gestation_weeks")).toBe(true);
  });

  it("Valid non-urgent referral -> can_submit true", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 30,
      bleeding: false,
      fever: false,
    });
    
    expect(result.urgency).toBe("green");
    expect(result.can_submit).toBe(true);
  });

  it("false boolean values are not treated as missing", () => {
    // Some logic could mistake false for missing if using !val instead of === undefined
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 40,
      bleeding: false, // should not be flagged as missing if it were required
    });
    expect(result.can_submit).toBe(true);
  });

  it("numeric 0 is not treated as missing when valid", () => {
    const result = evaluateProtocol(ANC_DANGER_PROTOCOL, {
      gestation_weeks: 0, // 0 weeks is a valid number, should not be treated as missing
    });
    expect(result.can_submit).toBe(true);
    expect(result.completeness.missing.some(m => m.field === "gestation_weeks")).toBe(false);
  });
});

describe("Triage Engine - Adult General Protocol", () => {
  it("Chest pain -> red", () => {
    const result = evaluateProtocol(ADULT_GENERAL_PROTOCOL, {
      age: 45,
      chest_pain: true,
      bp: "140/90",
      spo2: 95,
    });
    expect(result.urgency).toBe("red");
    expect(result.matched_rules).toContain("red_chest_pain");
    expect(result.can_submit).toBe(true);
  });
  
  it("Missing vitals on urgent Adult referral blocks submission", () => {
    const result = evaluateProtocol(ADULT_GENERAL_PROTOCOL, {
      age: 50,
      altered_sensorium: true, // red
      // missing bp and spo2
    });
    expect(result.urgency).toBe("red");
    expect(result.can_submit).toBe(false);
    expect(result.completeness.missing.some(m => m.field === "bp")).toBe(true);
    expect(result.completeness.missing.some(m => m.field === "spo2")).toBe(true);
  });
});

describe("Pure Logic / Determinism", () => {
  it("should return the exact same output for the same input", () => {
    const input = { gestation_weeks: 34, bleeding: true, bp: "120/80" };
    
    const result1 = evaluateProtocol(ANC_DANGER_PROTOCOL, input);
    const result2 = evaluateProtocol(ANC_DANGER_PROTOCOL, input);
    
    expect(result1).toEqual(result2);
  });
});
