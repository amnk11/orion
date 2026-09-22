import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { config } from "../src/lib/config";

describe("Phase 10: Security Hardening", () => {
  it("should include helmet security headers", async () => {
    const res = await request(app).get("/api/health");
    // Helmet sets X-Frame-Options by default
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should handle CORS correctly", async () => {
    // We send a request with a fake origin
    const res = await request(app)
      .options("/api/health")
      .set("Origin", "http://malicious.com");
    
    // Express cors middleware will not echo the malicious origin back in Access-Control-Allow-Origin
    // if it doesn't match the configured origin (unless it's set to '*')
    if (config.CORS_ORIGIN !== "*") {
      expect(res.headers["access-control-allow-origin"]).not.toBe("http://malicious.com");
    }
  });

  it("should allow configured CORS origin", async () => {
    const res = await request(app)
      .options("/api/health")
      .set("Origin", config.CORS_ORIGIN);
    
    if (config.CORS_ORIGIN !== "*") {
      expect(res.headers["access-control-allow-origin"]).toBe(config.CORS_ORIGIN);
    }
  });
});
