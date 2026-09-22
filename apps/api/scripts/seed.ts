import { db } from "../src/lib/db";
import { auth } from "../src/lib/auth";
import {
  organizations,
  facilities,
  patients,
  protocols,
  capabilitySnapshots,
  users,
  careEpisodes,
  assessments,
  handoffs
} from "@orion/db";
import { eq, and } from "drizzle-orm";

const DEMO_PASSWORD = "SahayDemoPass123!";

export async function seed() {
  console.log("🌱 Starting Sahay Phase 10 idempotent database seed...");

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

  // Delete old organizations if they exist
  const oldOrgs = ["Central Health System", "Bihar Health System"];
  for (const oldOrgName of oldOrgs) {
    const [oldOrg] = await db.select().from(organizations).where(eq(organizations.name, oldOrgName)).limit(1);
    if (oldOrg) {
      console.log(`  [!] Found old ${oldOrgName} data, deleting...`);
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
      console.log(`  [-] Deleted old ${oldOrgName}`);
    }
  }

  // 2. Facilities (4 demo facilities in Maharashtra corridor)
  const facilityDefs = [
    {
      name: "AAM Wadgaon",
      tier: "aam",
      isFru: false,
      block: "Wadgaon Sheri",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.5529",
      lng: "73.9317",
    },
    {
      name: "PHC Chakan",
      tier: "phc",
      isFru: false,
      block: "Khed",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.7500",
      lng: "73.8500",
    },
    {
      name: "CHC Rajgurunagar",
      tier: "chc",
      isFru: true,
      block: "Khed",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.8500",
      lng: "73.8800",
    },
    {
      name: "DH Pune",
      tier: "dh",
      isFru: true,
      block: "Pune City",
      district: "Pune",
      state: "Maharashtra",
      lat: "18.5204",
      lng: "73.8567",
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
      name: "Sunita Kale",
      email: "cho.wadgaon@sahay.demo",
      role: "origin" as const,
      facilityName: "AAM Wadgaon",
    },
    {
      name: "Dr. Aniket Deshmukh",
      email: "mo.chakan@sahay.demo",
      role: "origin" as const,
      facilityName: "PHC Chakan",
    },
    {
      name: "Pooja Patil",
      email: "desk.rajgurunagar@sahay.demo",
      role: "destination" as const,
      facilityName: "CHC Rajgurunagar",
    },
    {
      name: "Dr. K. Joshi",
      email: "desk.pune@sahay.demo",
      role: "destination" as const,
      facilityName: "DH Pune",
    },
    {
      name: "Dr. R. Kulkarni",
      email: "supervisor.pune@sahay.demo",
      role: "supervisor" as const,
      facilityName: "DH Pune",
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
  const supervisorId = userMap["supervisor.pune@sahay.demo"];

  const now = new Date();
  const staleDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago (STALE)
  const veryStaleDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago (VERY_STALE)

  const facilityCapabilityMatrix: Record<
    string,
    Record<string, { status: "verified_available" | "verified_unavailable" | "unknown"; attestedAt?: Date }>
  > = {
    "AAM Wadgaon": {
      obgyn: { status: "unknown" }, // UNKNOWN + fresh
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
      lab: { status: "verified_available", attestedAt: staleDate }, // STALE (48h)
    },
    "CHC Rajgurunagar": {
      obgyn: { status: "verified_available", attestedAt: veryStaleDate }, // VERY_STALE (15 days)
      functional_ot: { status: "verified_unavailable" }, // Demo: CHC has NO functional OT
      blood_bank: { status: "verified_unavailable" },
      icu: { status: "verified_unavailable" },
      lab: { status: "verified_available" },
    },
    "DH Pune": {
      obgyn: { status: "verified_available" },
      functional_ot: { status: "verified_available" }, // Demo: DH HAS functional OT
      blood_bank: { status: "verified_available" },
      icu: { status: "verified_available" },
      lab: { status: "verified_available" },
    },
  };

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
      displayName: "Ramesh Patil (Synthetic Demo)",
      age: 45,
      sex: "male",
      abhaMock: "91-0000-0001-XX",
      facilityName: "AAM Wadgaon",
    },
    {
      displayName: "Savitri Jadhav (Synthetic Demo)",
      age: 26,
      sex: "female",
      abhaMock: "91-0000-0002-XX",
      facilityName: "AAM Wadgaon",
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

  
  // 7. Synthetic Referrals (Phase 10 demo data)
  console.log("  [ ] Creating realistic referral scenarios...");

  const generatePublicCode = (prefix) => prefix + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const referralScenarios = [
    {
      patientName: "Meena Pawar",
      age: 26,
      sex: "female",
      abhaMock: "91-MH00-0003-XX",
      originFacility: "AAM Wadgaon",
      destFacility: "PHC Chakan",
      urgency: "green",
      state: "accepted",
      protocol: "anc_danger"
    },
    {
      patientName: "Kavita Shinde",
      age: 24,
      sex: "female",
      abhaMock: "91-MH00-0004-XX",
      originFacility: "AAM Wadgaon",
      destFacility: "CHC Rajgurunagar",
      urgency: "orange",
      state: "sent",
      protocol: "anc_danger"
    },
    {
      patientName: "Prakash Bhosale",
      age: 55,
      sex: "male",
      abhaMock: "91-MH00-0005-XX",
      originFacility: "PHC Chakan",
      destFacility: "CHC Rajgurunagar",
      urgency: "green",
      state: "arrived",
      protocol: "adult_general"
    },
    {
      patientName: "Savita Gaikwad",
      age: 32,
      sex: "female",
      abhaMock: "91-MH00-0006-XX",
      originFacility: "CHC Rajgurunagar",
      destFacility: "DH Pune",
      urgency: "red",
      state: "closed",
      protocol: "anc_danger"
    }
  ];

  for (const sc of referralScenarios) {
    const originId = facilityMap[sc.originFacility];
    const destId = facilityMap[sc.destFacility];
    
    // 1. Create Patient
    let [patient] = await db.select().from(patients).where(eq(patients.abhaMock, sc.abhaMock)).limit(1);
    if (!patient) {
      [patient] = await db.insert(patients).values({
        displayName: sc.patientName,
        age: sc.age,
        sex: sc.sex,
        abhaMock: sc.abhaMock,
        createdByFacilityId: originId,
        isSynthetic: true
      }).returning();
    }

    // 2. Check if care episode exists for patient
    let [episode] = await db.select().from(careEpisodes).where(eq(careEpisodes.patientId, patient.id)).limit(1);
    if (!episode) {
      [episode] = await db.insert(careEpisodes).values({
        publicCode: generatePublicCode("CE"),
        patientId: patient.id,
        openedByFacilityId: originId,
        status: sc.state === "closed" ? "closed" : "open"
      }).returning();
    }

    // 3. Create Assessment
    let [assessment] = await db.select().from(assessments).where(eq(assessments.episodeId, episode.id)).limit(1);
    if (!assessment) {
      [assessment] = await db.insert(assessments).values({
        episodeId: episode.id,
        protocolCode: sc.protocol,
        answersJson: sc.protocol === "anc_danger" ? { gestationalAgeWeeks: 32, bloodPressureSystolic: 140, dangerSigns: ["severe_headache"] } : { primaryComplaint: "Chest pain", systolicBp: 150 },
        triageJson: { urgency: sc.urgency },
        assessedBy: userMap[`cho.${sc.originFacility.split(' ')[1].toLowerCase()}@sahay.demo`] || userMap['supervisor.pune@sahay.demo']
      }).returning();
    }

    // 4. Create Handoff
    let [handoff] = await db.select().from(handoffs).where(eq(handoffs.episodeId, episode.id)).limit(1);
    if (!handoff) {
      await db.insert(handoffs).values({
        publicCode: generatePublicCode("HO"),
        episodeId: episode.id,
        assessmentId: assessment.id,
        patientId: patient.id,
        originFacilityId: originId,
        destinationFacilityId: destId,
        currentDestinationFacilityId: destId,
        protocolCode: sc.protocol,
        urgency: sc.urgency,
        state: sc.state,
        reasonForReferral: "Further evaluation required",
        packetJson: {},
        idempotencyKey: sc.abhaMock + "-handoff-1"
      });
      console.log(`  [+] Created Referral for ${sc.patientName}: ${sc.originFacility} -> ${sc.destFacility} (${sc.state})`);
    }
  }

  // Update existing patients to realistic names instead of Ramesh Patil (Synthetic Demo)
  await db.update(patients).set({ displayName: "Ramesh Patil" }).where(eq(patients.displayName, "Ramesh Patil (Synthetic Demo)"));
  await db.update(patients).set({ displayName: "Savitri Jadhav" }).where(eq(patients.displayName, "Savitri Jadhav (Synthetic Demo)"));

console.log("\n✅ Sahay Phase 10 Seed Completed Successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Staff Credentials (Password for all: SahayDemoPass123!):");
  console.log("  1. Origin CHO:       cho.wadgaon@sahay.demo");
  console.log("  2. Origin MO:        mo.chakan@sahay.demo");
  console.log("  3. Destination CHC:  desk.rajgurunagar@sahay.demo");
  console.log("  4. Destination DH:   desk.pune@sahay.demo");
  console.log("  5. Supervisor DHO:   supervisor.pune@sahay.demo");
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
