import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";
import {
  organizations,
  facilities,
  patients,
  protocols,
  capabilitySnapshots,
  users,
} from "@orion/db";
import { eq, and } from "drizzle-orm";

const DEMO_PASSWORD = "OrionDemoPass123!";

export async function seed() {
  console.log("🌱 Starting Orion Phase 1 idempotent database seed...");

  // 1. Organization: Maharashtra Health System
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Maharashtra Health System"))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: "Maharashtra Health System",
        type: "health_system",
      })
      .returning();
    console.log(`  [+] Created Organization: ${org.name} (${org.id})`);
  } else {
    console.log(`  [=] Organization exists: ${org.name} (${org.id})`);
  }

  const [oldOrg] = await db.select().from(organizations).where(eq(organizations.name, "Bihar Health System")).limit(1);
  if (oldOrg) {
     console.log(`  [!] Found old Bihar data, deleting...`);
     const oldFacilities = await db.select().from(facilities).where(eq(facilities.orgId, oldOrg.id));
     const facilityIds = oldFacilities.map(f => f.id);
     
     if (facilityIds.length > 0) {
       for (const fId of facilityIds) {
         await db.delete(capabilitySnapshots).where(eq(capabilitySnapshots.facilityId, fId));
         await db.delete(patients).where(eq(patients.createdByFacilityId, fId));
         await db.delete(users).where(eq(users.facilityId, fId));
         await db.delete(facilities).where(eq(facilities.id, fId));
       }
     }
     await db.delete(organizations).where(eq(organizations.id, oldOrg.id));
     console.log(`  [-] Deleted old Bihar Health System`);
  }

  // 2. Facilities (4 demo facilities in Maharashtra corridor)
  const facilityDefs = [
    {
      name: "AAM Wadgaon",
      tier: "aam",
      isFru: false,
      block: "Khed",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.7300000",
      lng: "73.8800000",
    },
    {
      name: "PHC Chakan",
      tier: "phc",
      isFru: false,
      block: "Khed",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.7500000",
      lng: "73.8500000",
    },
    {
      name: "CHC Rajgurunagar",
      tier: "chc",
      isFru: true,
      block: "Khed",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.8500000",
      lng: "73.8800000",
    },
    {
      name: "District Hospital Pune",
      tier: "dh",
      isFru: true,
      block: "Pune City",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.5204000",
      lng: "73.8567000",
    },
  ];

  const facilityMap: Record<string, string> = {};

  for (const def of facilityDefs) {
    let [fac] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.name, def.name))
      .limit(1);

    if (!fac) {
      [fac] = await db
        .insert(facilities)
        .values({
          ...def,
          orgId: org.id,
        })
        .returning();
      console.log(`  [+] Created Facility: ${fac.name} (${fac.id})`);
    } else {
      console.log(`  [=] Facility exists: ${fac.name} (${fac.id})`);
    }
    facilityMap[def.name] = fac.id;
  }

  // 3. Staff Users
  const staffDefs = [
    {
      name: "Supriya Patil",
      email: "cho.wadgaon@orion.local",
      role: "origin" as const,
      facilityName: "AAM Wadgaon",
    },
    {
      name: "Dr. Avinash Deshmukh",
      email: "mo.chakan@orion.local",
      role: "origin" as const,
      facilityName: "PHC Chakan",
    },
    {
      name: "Neha Joshi",
      email: "desk.rajgurunagar@orion.local",
      role: "destination" as const,
      facilityName: "CHC Rajgurunagar",
    },
    {
      name: "Dr. Vikram Kulkarni",
      email: "desk.dhpune@orion.local",
      role: "destination" as const,
      facilityName: "District Hospital Pune",
    },
    {
      name: "Dr. Sneha Pawar",
      email: "supervisor.pune@orion.local",
      role: "supervisor" as const,
      facilityName: "District Hospital Pune",
    },
  ];

  const userMap: Record<string, string> = {};

  for (const staff of staffDefs) {
    const facilityId = facilityMap[staff.facilityName];
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, staff.email))
      .limit(1);

    if (!existingUser) {
      const authResult = await auth.api.signUpEmail({
        body: {
          email: staff.email,
          password: DEMO_PASSWORD,
          name: staff.name,
        },
      });

      if (!authResult?.user) {
        throw new Error(`Failed to create Better Auth user for ${staff.email}`);
      }

      const [updated] = await db
        .update(users)
        .set({
          role: staff.role,
          facilityId,
        })
        .where(eq(users.id, authResult.user.id))
        .returning();

      existingUser = updated;
      console.log(`  [+] Created User: ${staff.name} (${staff.email}) -> Role: ${staff.role}`);
    } else {
      const [updated] = await db
        .update(users)
        .set({
          role: staff.role,
          facilityId,
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      existingUser = updated;
      console.log(`  [=] User exists: ${staff.name} (${staff.email}) -> Role: ${staff.role}`);
    }
    userMap[staff.email] = existingUser.id;
  }

  // 4. Protocols
  const protocolDefs = [
    {
      code: "anc_danger",
      name: "Antenatal Care Danger Signs",
      version: "1.0",
      schemaJson: {
        protocol: "anc_danger",
        title: "Antenatal Care Danger Signs",
        version: "1.0",
        requiredFields: [
          "gestationalAgeWeeks",
          "bloodPressureSystolic",
          "bloodPressureDiastolic",
          "dangerSigns",
        ],
        dangerSignsOptions: [
          "severe_headache",
          "blurred_vision",
          "convulsions",
          "vaginal_bleeding",
          "severe_abdominal_pain",
          "reduced_fetal_movement",
        ],
      },
    },
    {
      code: "adult_general",
      name: "Adult General Triage",
      version: "1.0",
      schemaJson: {
        protocol: "adult_general",
        title: "Adult General Triage",
        version: "1.0",
        requiredFields: [
          "primaryComplaint",
          "systolicBp",
          "pulseRate",
          "spo2",
          "temperature",
        ],
        urgencyCriteria: {
          red: ["spo2 < 90", "systolicBp < 90"],
          orange: ["spo2 <= 94", "pulseRate > 120"],
          green: ["vitals_stable"],
        },
      },
    },
  ];

  for (const proto of protocolDefs) {
    const [existing] = await db
      .select()
      .from(protocols)
      .where(eq(protocols.code, proto.code))
      .limit(1);

    if (!existing) {
      await db.insert(protocols).values(proto);
      console.log(`  [+] Created Protocol: ${proto.name} (${proto.code})`);
    } else {
      await db
        .update(protocols)
        .set({ name: proto.name, schemaJson: proto.schemaJson, updatedAt: new Date() })
        .where(eq(protocols.code, proto.code));
      console.log(`  [=] Protocol exists: ${proto.name} (${proto.code})`);
    }
  }

  // 5. Capability Snapshots
  const serviceCodes = ["obgyn", "functional_ot", "blood_bank", "icu", "lab"] as const;
  const supervisorId = userMap["supervisor.pune@orion.local"];

  const now = new Date();
  const staleDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago

  const facilityCapabilityMatrix: Record<
    string,
    Record<string, { status: "verified_available" | "verified_unavailable" | "unknown"; attestedAt?: Date }>
  > = {
    "AAM Wadgaon": {
      obgyn: { status: "unknown" },
      functional_ot: { status: "verified_unavailable" },
      blood_bank: { status: "verified_unavailable" },
      icu: { status: "verified_unavailable" },
      lab: { status: "verified_available" },
    },
    "PHC Chakan": {
      obgyn: { status: "verified_available" },
      functional_ot: { status: "verified_unavailable" },
      blood_bank: { status: "verified_unavailable" },
      icu: { status: "verified_unavailable" },
      lab: { status: "verified_available" },
    },
    "CHC Rajgurunagar": {
      obgyn: { status: "verified_available" }, // Stale!
      functional_ot: { status: "verified_available" },
      blood_bank: { status: "verified_unavailable" },
      icu: { status: "verified_unavailable" },
      lab: { status: "verified_available" },
    },
    "District Hospital Pune": {
      obgyn: { status: "verified_available" },
      functional_ot: { status: "verified_available" },
      blood_bank: { status: "verified_available" },
      icu: { status: "verified_available" },
      lab: { status: "verified_available" },
    },
  };

  // Mark Rajgurunagar obgyn as stale by setting an old attestedAt
  facilityCapabilityMatrix["CHC Rajgurunagar"]["obgyn"].attestedAt = staleDate;

  for (const [facilityName, services] of Object.entries(facilityCapabilityMatrix)) {
    const facilityId = facilityMap[facilityName];
    for (const serviceCode of serviceCodes) {
      const def = services[serviceCode];
      const attestedAt = def.attestedAt || new Date();
      
      const [existing] = await db
        .select()
        .from(capabilitySnapshots)
        .where(
          and(
            eq(capabilitySnapshots.facilityId, facilityId),
            eq(capabilitySnapshots.serviceCode, serviceCode)
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(capabilitySnapshots).values({
          facilityId,
          serviceCode,
          status: def.status,
          attestedBy: supervisorId,
          attestedAt: attestedAt,
          note: `Seed snapshot for ${facilityName} - ${serviceCode}`,
        });
      } else {
        await db
          .update(capabilitySnapshots)
          .set({
            status: def.status,
            attestedBy: supervisorId,
            attestedAt: attestedAt,
          })
          .where(eq(capabilitySnapshots.id, existing.id));
      }
    }
  }
  console.log(`  [✓] Capability records seeded/updated across 4 facilities (including stale fixtures)`);

  // 6. Synthetic Patients
  const patientDefs = [
    {
      displayName: "Ramesh Jadhav (Synthetic Demo)",
      age: 45,
      sex: "male",
      abhaMock: "91-0000-0001-MH",
      facilityName: "AAM Wadgaon",
    },
    {
      displayName: "Sunita Kadam (Synthetic Demo)",
      age: 28,
      sex: "female",
      abhaMock: "91-0000-0002-MH",
      facilityName: "PHC Chakan",
    },
  ];

  for (const pat of patientDefs) {
    const createdByFacilityId = facilityMap[pat.facilityName];
    const [existing] = await db
      .select()
      .from(patients)
      .where(eq(patients.abhaMock, pat.abhaMock))
      .limit(1);

    if (!existing) {
      await db.insert(patients).values({
        displayName: pat.displayName,
        age: pat.age,
        sex: pat.sex,
        abhaMock: pat.abhaMock,
        createdByFacilityId,
        isSynthetic: true,
      });
      console.log(`  [+] Created Patient: ${pat.displayName}`);
    } else {
      console.log(`  [=] Patient exists: ${pat.displayName}`);
    }
  }

  console.log("\n✅ Orion Phase 1 Seed Completed Successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Staff Credentials (Password for all: OrionDemoPass123!):");
  console.log("  1. Origin CHO:       cho.wadgaon@orion.local");
  console.log("  2. Origin MO:        mo.chakan@orion.local");
  console.log("  3. Destination CHC:  desk.rajgurunagar@orion.local");
  console.log("  4. Destination DH:   desk.dhpune@orion.local");
  console.log("  5. Supervisor DHO:   supervisor.pune@orion.local");
  console.log("--------------------------------------------------");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
