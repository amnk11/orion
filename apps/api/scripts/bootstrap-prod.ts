import "dotenv/config";
import { db, users, facilities, eq } from "@orion/db";
import { auth } from "../src/lib/auth";

/**
 * Safe script to bootstrap a production environment.
 * Creates ONE facility and ONE admin/supervisor user.
 */
async function bootstrapProd() {
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "development") {
    console.log("Not running in production/development mode. Skipping.");
    return;
  }

  console.log("--- Starting Production Bootstrap ---");

  // 1. Create a root facility if none exists
  const existingFacilities = await db.select().from(facilities).limit(1);
  let facilityId: string;

  if (existingFacilities.length === 0) {
    console.log("No facilities found. Creating root facility...");
    const [fac] = await db.insert(facilities).values({
      name: "Sahay Root Facility",
      type: "dh",
      state: "Maharashtra",
      district: "Pune",
      taluka: "Pune City",
    }).returning();
    facilityId = fac.id;
  } else {
    console.log("Facility already exists. Using existing.");
    facilityId = existingFacilities[0].id;
  }

  // 2. Create the admin user if they don't exist
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sahay.local";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SahayAdmin123!";

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, ADMIN_EMAIL)
  });

  if (!existingUser) {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);
    await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Sahay Admin",
      }
    });

    // Update their role and facility
    await db.update(users)
      .set({ role: "supervisor", facilityId })
      .where(eq(users.email, ADMIN_EMAIL));
      
    console.log("Admin user created successfully.");
  } else {
    console.log("Admin user already exists. Skipping.");
  }

  console.log("--- Bootstrap Complete ---");
  process.exit(0);
}

bootstrapProd().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
