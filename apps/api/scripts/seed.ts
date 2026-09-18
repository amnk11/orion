import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";
import {
  organizations,
  facilities,
  patients,
  protocols,
  capabilities,
  users,
} from "@orion/db";
import { eq, and } from "drizzle-orm";

const DEMO_PASSWORD = "OrionDemoPass123!";

export async function seed() {
  console.log("🌱 Starting Orion Phase 1 idempotent database seed...");

  // 1. Organization: Bihar Health System
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, "Bihar Health System"))
    .limit(1);

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({
        name: "Bihar Health System",
        type: "health_system",
      })
      .returning();
    console.log(`  [+] Created Organization: ${org.name} (${org.id})`);
  } else {
    console.log(`  [=] Organization exists: ${org.name} (${org.id})`);
  }

  // 2. Facilities (5 demo facilities in Bihar)
  const facilityDefs = [
    {
      name: "AAM Rampur",
      tier: "AAM",
      isFru: false,
      block: "Kasba",
      district: "Purnia",
      state: "Bihar",
      lat: "25.7711000",
      lng: "87.4722000",
    },
    {
      name: "PHC Sonpur",
      tier: "phc",
      isFru: false,
      block: "Baisa",
      district: "Purnia",
      state: "Bihar",
      lat: "25.8123000",
      lng: "87.5210000",
    },
    {
      name: "CHC Purnia",
      tier: "chc",
      isFru: false,
      block: "Purnia East",
      district: "Purnia",
      state: "Bihar",
      lat: "25.7788000",
      lng: "87.4755000",
    },
    {
      name: "CHC/FRU Kishanganj",
      tier: "chc",
      isFru: true,
      block: "Kishanganj",
      district: "Kishanganj",
      state: "Bihar",
      lat: "26.0890000",
      lng: "87.9420000",
    },
    {
      name: "District Hospital Purnia",
      tier: "dh",
      isFru: true,
      block: "Purnia Sadar",
      district: "Purnia",
      state: "Bihar",
      lat: "25.7820000",
      lng: "87.4810000",
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

  // 3. Staff Users (5 users: 2 origin, 2 destination, 1 supervisor)
  const staffDefs = [
    {
      name: "Anjali Kumari",
      email: "cho.rampur@orion.local",
      role: "origin" as const,
      facilityName: "AAM Rampur",
    },
    {
      name: "Dr. Rajesh Sharma",
      email: "mo.sonpur@orion.local",
      role: "origin" as const,
      facilityName: "PHC Sonpur",
    },
    {
      name: "Pooja Singh",
      email: "desk.chcpurnia@orion.local",
      role: "destination" as const,
      facilityName: "CHC Purnia",
    },
    {
      name: "Dr. Amit Verma",
      email: "desk.dhpurnia@orion.local",
      role: "destination" as const,
      facilityName: "District Hospital Purnia",
    },
    {
      name: "Dr. Sunita Rao",
      email: "supervisor.purnia@orion.local",
      role: "supervisor" as const,
      facilityName: "District Hospital Purnia",
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
      // Create user via Better Auth server-side provisioning
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

      // Assign server-owned fields: role and facilityId
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
      // Ensure role and facilityId are up-to-date
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

  // 4. Protocols (2 protocols: anc_danger, adult_general)
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

  // 5. Capability Snapshots (5 services per facility)
  const serviceCodes = ["obgyn", "functional_ot", "blood_bank", "icu", "lab"] as const;
  const supervisorId = userMap["supervisor.purnia@orion.local"];

  const facilityCapabilityMatrix: Record<
    string,
    Record<string, "available" | "unavailable" | "unknown">
  > = {
    "AAM Rampur": {
      obgyn: "unknown",
      functional_ot: "unavailable",
      blood_bank: "unavailable",
      icu: "unavailable",
      lab: "available",
    },
    "PHC Sonpur": {
      obgyn: "available",
      functional_ot: "unavailable",
      blood_bank: "unavailable",
      icu: "unavailable",
      lab: "available",
    },
    "CHC Purnia": {
      obgyn: "available",
      functional_ot: "unavailable",
      blood_bank: "unavailable",
      icu: "unavailable",
      lab: "available",
    },
    "CHC/FRU Kishanganj": {
      obgyn: "available",
      functional_ot: "available",
      blood_bank: "available",
      icu: "unavailable",
      lab: "available",
    },
    "District Hospital Purnia": {
      obgyn: "available",
      functional_ot: "available",
      blood_bank: "available",
      icu: "available",
      lab: "available",
    },
  };

  for (const [facilityName, services] of Object.entries(facilityCapabilityMatrix)) {
    const facilityId = facilityMap[facilityName];
    for (const serviceCode of serviceCodes) {
      const status = services[serviceCode];
      const [existing] = await db
        .select()
        .from(capabilities)
        .where(
          and(
            eq(capabilities.facilityId, facilityId),
            eq(capabilities.serviceCode, serviceCode)
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(capabilities).values({
          facilityId,
          serviceCode,
          status,
          attestedBy: supervisorId,
          attestedAt: new Date(),
          note: `Seed snapshot for ${facilityName} - ${serviceCode}`,
        });
      } else {
        await db
          .update(capabilities)
          .set({
            status,
            attestedBy: supervisorId,
            attestedAt: new Date(),
          })
          .where(eq(capabilities.id, existing.id));
      }
    }
  }
  console.log(`  [✓] 25 Capability records seeded/updated across 5 facilities`);

  // 6. Synthetic Patients (2 demo patients)
  const patientDefs = [
    {
      displayName: "Kavita Devi (Synthetic Demo)",
      age: 24,
      sex: "female",
      abhaMock: "91-0000-0001-DEMO",
      facilityName: "AAM Rampur",
    },
    {
      displayName: "Ram Prakash (Synthetic Demo)",
      age: 52,
      sex: "male",
      abhaMock: "91-0000-0002-DEMO",
      facilityName: "PHC Sonpur",
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
      });
      console.log(`  [+] Created Patient: ${pat.displayName}`);
    } else {
      console.log(`  [=] Patient exists: ${pat.displayName}`);
    }
  }

  console.log("\n✅ Orion Phase 1 Seed Completed Successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Staff Credentials (Password for all: OrionDemoPass123!):");
  console.log("  1. Origin CHO:       cho.rampur@orion.local");
  console.log("  2. Origin MO:        mo.sonpur@orion.local");
  console.log("  3. Destination CHC:  desk.chcpurnia@orion.local");
  console.log("  4. Destination DH:   desk.dhpurnia@orion.local");
  console.log("  5. Supervisor DHO:   supervisor.purnia@orion.local");
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
