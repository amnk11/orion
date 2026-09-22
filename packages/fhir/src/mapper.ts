import type { Handoff, Patient, Facility, HandoffEvent } from "@orion/db";

/**
 * Maps Orion Handoff data into a deterministic FHIR Bundle (STU3/R4 aligned).
 * This is a lightweight representation for interoperability.
 */
export function toFhirBundle(params: {
  handoff: Handoff;
  patient: Patient;
  originFacility: Facility;
  destinationFacility: Facility;
  events: HandoffEvent[];
}) {
  const { handoff, patient, originFacility, destinationFacility, events } = params;

  const now = new Date().toISOString();

  // 1. Patient Resource
  const patientResource = {
    resourceType: "Patient",
    id: patient.id,
    active: true,
    name: [
      {
        use: "official",
        text: patient.displayName,
      }
    ],
    gender: patient.sex === "M" ? "male" : patient.sex === "F" ? "female" : "unknown",
    // Orion prototype uses age instead of exact DOB for synthetic simplicity
    birthDate: patient.age ? new Date(new Date().setFullYear(new Date().getFullYear() - patient.age)).toISOString().split("T")[0] : undefined,
    identifier: [
      {
        system: "urn:oid:orion:patient",
        value: patient.id,
      }
    ]
  };

  // 2. Origin Organization
  const originResource = {
    resourceType: "Organization",
    id: originFacility.id,
    name: originFacility.name,
    type: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/organization-type",
            code: originFacility.type === "sc" ? "prov" : "dept"
          }
        ]
      }
    ]
  };

  // 3. Destination Organization
  const destResource = {
    resourceType: "Organization",
    id: destinationFacility.id,
    name: destinationFacility.name,
  };

  // 4. ServiceRequest (The Referral)
  const serviceRequestResource = {
    resourceType: "ServiceRequest",
    id: handoff.id,
    status: mapHandoffStateToFhir(handoff.state),
    intent: "order",
    priority: mapUrgencyToFhir(handoff.urgency),
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.displayName,
    },
    requester: {
      reference: `Organization/${originFacility.id}`,
      display: originFacility.name,
    },
    performer: [
      {
        reference: `Organization/${destinationFacility.id}`,
        display: destinationFacility.name,
      }
    ],
    reasonCode: [
      {
        text: handoff.reasonForReferral || "Clinical transfer",
      }
    ],
    authoredOn: handoff.createdAt.toISOString(),
  };

  return {
    resourceType: "Bundle",
    id: `bundle-${handoff.id}`,
    type: "collection",
    timestamp: now,
    entry: [
      {
        fullUrl: `urn:uuid:${patient.id}`,
        resource: patientResource
      },
      {
        fullUrl: `urn:uuid:${originFacility.id}`,
        resource: originResource
      },
      {
        fullUrl: `urn:uuid:${destinationFacility.id}`,
        resource: destResource
      },
      {
        fullUrl: `urn:uuid:${handoff.id}`,
        resource: serviceRequestResource
      }
    ]
  };
}

function mapHandoffStateToFhir(state: string) {
  switch (state) {
    case "draft": return "draft";
    case "sent":
    case "acknowledged": return "active";
    case "redirected": return "revoked";
    case "closed": return "completed";
    case "cannot_accept": return "revoked";
    default: return "active";
  }
}

function mapUrgencyToFhir(urgency: string) {
  switch (urgency) {
    case "red": return "stat";
    case "orange": return "urgent";
    case "green": return "routine";
    default: return "routine";
  }
}
