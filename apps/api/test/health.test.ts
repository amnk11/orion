import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("GET /health", () => {
  it("should return HTTP 200 and ok: true with timestamp", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("ts");
    expect(typeof res.body.ts).toBe("string");
  });

  it("should return HTTP 404 for unknown routes", async () => {
    const res = await request(app).get("/non-existent-route");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
