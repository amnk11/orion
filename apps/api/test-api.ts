import request from "supertest";
import { app } from "./src/app";

async function run() {
  const destCreds = {
    email: "desk.rajgurunagar@orion.local",
    password: "OrionDemoPass123!",
  };

  const loginRes = await request(app).post("/api/auth/sign-in/email").send(destCreds);
  const cookies = loginRes.headers["set-cookie"];
  
  const res = await request(app).get("/api/v1/handoffs?role=inbound").set("Cookie", cookies);
  console.log("Status:", res.status);
  console.log("First item:", res.body.data?.[0]);
  
  process.exit(0);
}

run().catch(console.error);
