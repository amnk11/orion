"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  Building2,
  Hospital,
  Activity,
  WifiOff,
  Wifi,
  QrCode,
  Check,
  ChevronRight,
  GitBranch,
} from "lucide-react";

export default function LandingPage() {
  const [activeOfflineTab, setActiveOfflineTab] = React.useState<
    "offline" | "online"
  >("offline");

  const AUDIT_LOGS = [
    {
      time: "10:32:14",
      event: "HANDOFF_CREATED",
      facility: "AAM Rampur",
      actor: "CHO Pratibha Kumari (ID: USR-019)",
      detail:
        "Protocol OBS-02: Severe Preeclampsia / BP 162/108 / Proteinuria 3+",
      badge: "CREATED",
      badgeColor: "bg-surface-subtle text-foreground border-border",
    },
    {
      time: "10:33:02",
      event: "HANDOFF_SENT",
      facility: "AAM Rampur",
      actor: "System Sync Engine",
      detail:
        "Dispatched to CHC Purnia desk via secure regional network",
      badge: "SENT",
      badgeColor: "bg-surface-subtle text-foreground border-border",
    },
    {
      time: "10:36:19",
      event: "HANDOFF_VIEWED",
      facility: "CHC Purnia",
      actor: "Triage Nurse S. Murmu",
      detail: "Clinical packet viewed on receiving desk terminal",
      badge: "VIEWED",
      badgeColor: "bg-surface-subtle text-muted-foreground border-border",
    },
    {
      time: "10:38:40",
      event: "CANNOT_ACCEPT",
      facility: "CHC Purnia",
      actor: "MOIC Dr. B. K. Pathak",
      detail:
        "Reason: OT occupied with twin emergency laparotomy. No standby surgeon.",
      badge: "CANNOT ACCEPT",
      badgeColor: "bg-danger/10 text-danger border-danger/20",
    },
    {
      time: "10:39:15",
      event: "HANDOFF_REDIRECTED",
      facility: "CHC Purnia → DH Purnia",
      actor: "System Routing Protocol",
      detail:
        "Auto-escalated to tertiary destination: District Hospital Purnia (Obstetric Unit)",
      badge: "REDIRECTED (1)",
      badgeColor: "bg-warning/10 text-warning border-warning/20",
    },
    {
      time: "10:45:00",
      event: "HANDOFF_ACCEPTED",
      facility: "District Hospital Purnia",
      actor: "Desk MO Dr. R. K. Soren",
      detail:
        "Bed reserved in HDU-2. Blood Bank standby confirmed (O+ve 2 units).",
      badge: "ACCEPTED",
      badgeColor: "bg-success/10 text-success border-success/20",
    },
    {
      time: "11:12:30",
      event: "PATIENT_ARRIVED",
      facility: "District Hospital Purnia",
      actor: "Triage Gate Scanner",
      detail:
        "Verified via patient physical QR slip token. Transit duration: 33 min.",
      badge: "ARRIVED",
      badgeColor: "bg-success/10 text-success border-success/20",
    },
    {
      time: "14:20:10",
      event: "RETURN_NOTE_ADDED",
      facility: "District Hospital Purnia",
      actor: "Consultant ObGyn Dr. A. Sen",
      detail:
        "Emergency LSCS performed. Healthy neonate (2.8kg). Counter-referral transmitted to AAM Rampur for BP monitoring.",
      badge: "CLOSED LOOP",
      badgeColor: "bg-primary text-primary-foreground border-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xs border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] rounded border border-primary/20 tracking-tighter shrink-0">
              OR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-sm text-foreground">
                  ORION
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-muted-foreground border border-border hidden sm:inline">
                  Prototype v1.0
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden md:block leading-none mt-0.5">
                Care Access &amp; Referral Coordination System
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <a
              href="#problem"
              className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Problem
            </a>
            <a
              href="#handoff"
              className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              The Handoff
            </a>
            <a
              href="#proof"
              className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Capabilities
            </a>
            <a
              href="#context"
              className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Architecture
            </a>
            <a
              href="#deployment"
              className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Roles
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded border border-primary/20 shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Staff Portal
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════
            SECTION A — HERO
            Archetype: Editorial, generous whitespace, asymmetric split
        ═══════════════════════════════════════════════════════════ */}
        <section className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-56px)] lg:min-h-0 lg:py-0">
              {/* Left: pure editorial — large type, generous breathing room */}
              <div className="lg:col-span-5 flex flex-col justify-center py-20 lg:py-28 lg:pr-12 space-y-8 lg:border-r lg:border-border">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-subtle border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
                    Orion Operational Network · Demonstration
                  </div>

                  <h1 className="text-[2.8rem] sm:text-[3.5rem] font-extrabold tracking-tight text-foreground leading-[1.06]">
                    Close the
                    <br />
                    Referral Loop.
                  </h1>
                </div>

                <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                  Orion coordinates patient transfers between public health
                  facilities — from structured triage and referral to
                  destination acceptance, verified arrival, and return outcome
                  documentation.
                </p>

                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded border border-primary shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span>Open Referral Desk</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Sign in with facility credentials assigned by District
                    Health Society
                  </div>
                </div>

                <div className="pt-4 border-t border-border grid grid-cols-1 gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Zero Blind Bounces
                      </span>
                      <span className="text-muted-foreground">
                        Destination confirms capacity before patient leaves
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Offline Deterministic
                      </span>
                      <span className="text-muted-foreground">
                        Full local creation &amp; QR verification without 4G
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        Closed Feedback
                      </span>
                      <span className="text-muted-foreground">
                        Discharge note returned to originating CHO
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Hero artifact — the Handoff in transit, authoritative product panel */}
              <div className="lg:col-span-7 flex items-center py-12 lg:py-20 lg:pl-12">
                <div className="w-full">
                  {/* Artifact: Active Handoff HF-7K2P */}
                  <div className="bg-background rounded-lg border-2 border-primary/15 shadow-sm overflow-hidden">
                    {/* Chrome bar — product identity */}
                    <div className="px-5 py-3 bg-surface-subtle border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground">
                        <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">COORDINATION AXIS</span>
                        <span className="text-muted-foreground">·</span>
                        <span>ACTIVE HANDOFF</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse shrink-0" />
                        TRANSIT IN PROGRESS
                      </span>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Origin Facility */}
                      <div className="p-4 rounded-md border border-border bg-surface-subtle/50 flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-muted-foreground tracking-wide">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span>Origin · Tier 1</span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">
                            AAM Rampur
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Ayushman Arogya Mandir · Block Purnia East
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-muted-foreground block">
                            10:32 AM
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-foreground mt-0.5 block">
                            CHO Initiated
                          </span>
                        </div>
                      </div>

                      {/* Transit channel — the Handoff packet itself */}
                      <div className="relative pl-8 border-l-2 border-dashed border-primary/25 py-1 mx-5">
                        <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                          ↓
                        </div>

                        {/* The product token — strongest visual in the artifact */}
                        <div className="bg-background p-5 rounded-md border border-primary/20 shadow-[0_1px_4px_0_rgba(0,0,0,0.06)] space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-black text-foreground tracking-tight">
                                  HF-7K2P
                                </span>
                                <span className="text-xs font-semibold text-danger flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                                  Urgent · Severe Preeclampsia
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                Protocol OBS-02 · Female 24y · 34w 2d gestation
                              </p>
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                              Elapsed: 13 min
                            </span>
                          </div>

                          {/* Transit progress track */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-success">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-foreground font-semibold">Sent</span>
                              <span className="text-muted-foreground">10:33 — CHC Purnia desk received packet</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-success">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-foreground font-semibold">CHC Redirected</span>
                              <span className="text-muted-foreground">10:39 — OT occupied, auto-escalated to DH</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-primary">
                              <Clock className="h-3.5 w-3.5 shrink-0 motion-safe:animate-pulse" />
                              <span className="font-semibold">Accepted at DH Purnia</span>
                              <span className="text-muted-foreground">10:45 — HDU-2 bed reserved</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Destination Facility */}
                      <div className="p-4 rounded-md border border-border bg-surface-subtle/50 flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-muted-foreground tracking-wide">
                            <Hospital className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>Destination · Tier 3</span>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">
                            District Hospital Purnia
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Maternal &amp; Child Health Wing · Bed Reserved (HDU-2)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-success block font-semibold">
                            STANDBY READY
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground mt-0.5 block">
                            ETA 11:15 AM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer — Verification identity */}
                    <div className="px-5 py-3 border-t border-border bg-surface-subtle/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Verification ID: 4f8b9e.38d2</span>
                      <span className="text-foreground font-semibold">State: IN_TRANSIT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION B — THE PROBLEM
            Archetype: Dense narrative, chronological failure, urgent
        ═══════════════════════════════════════════════════════════ */}
        <section id="problem" className="py-20 border-b border-border bg-surface-subtle/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-4">
                <span className="font-mono text-xs uppercase tracking-widest text-danger font-semibold">
                  The Operational Failure
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Referrals fail in the void between facilities.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  When a CHO issues a paper referral slip, digital continuity
                  terminates. The receiving facility has no advance
                  notification. The patient travels unassisted with zero
                  assurance of specialist availability. The origin provider
                  never learns whether care was received.
                </p>
              </div>

              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 rounded border border-border overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {[
                    {
                      time: "09:42 AM",
                      tag: "Origin",
                      tagColor: "bg-surface-subtle text-foreground border-border",
                      title: "Paper Slip Issued",
                      body: "CHO identifies severe preeclampsia. Writes a manual slip with vital signs.",
                      fault: "Data trapped on paper",
                    },
                    {
                      time: "09:47 AM",
                      tag: "Blind Dispatch",
                      tagColor: "bg-warning/10 text-warning border-warning/20",
                      title: "Capacity Unknown",
                      body: "Patient dispatched toward CHC Purnia without knowing whether the OT is available today.",
                      fault: "Zero resource visibility",
                    },
                    {
                      time: "10:11 AM",
                      tag: "Gate Rejection",
                      tagColor: "bg-danger/10 text-danger border-danger/20",
                      title: "Turned Away",
                      body: "Single OT occupied. Desk verbally instructs family to proceed to DH Purnia.",
                      fault: "30 min transit wasted",
                    },
                  ].map((step) => (
                    <div key={step.time} className="p-4 bg-background space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          {step.time}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${step.tagColor}`}
                        >
                          {step.tag}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {step.body}
                        </p>
                      </div>
                      <div className="text-[11px] font-mono text-danger flex items-center gap-1">
                        <span>●</span>
                        <span>{step.fault}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* The outcome — full-width below the 3 steps */}
                <div className="mt-3 p-4 rounded border border-danger/30 bg-danger/5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-danger font-semibold uppercase tracking-widest mb-1">
                      Subsequent Days
                    </div>
                    <h3 className="text-sm font-bold text-danger">
                      Follow-up Lost
                    </h3>
                    <p className="text-xs text-muted-foreground leading-normal mt-1">
                      CHO at Rampur never receives confirmation of delivery or
                      post-op discharge guidance. Community continuity is
                      broken.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-danger font-semibold shrink-0">
                    ● Zero clinical accountability
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION C — THE HANDOFF
            Archetype: CENTERPIECE — breaks the grid, full bleed accent,
            heavy type, maximum vertical rhythm, dominant audit trail
        ═══════════════════════════════════════════════════════════ */}
        <section
          id="handoff"
          className="py-24 sm:py-32 border-b border-border relative overflow-hidden"
        >
          {/* Structural left-accent — not decoration, indicates centerpiece status */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pl-8 sm:pl-10">
            {/* Section identity — header only, no eyebrow */}
            <div className="max-w-3xl mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-5">
                A referral should remain visible
                <br className="hidden sm:block" />
                <span className="text-primary"> after it is sent.</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                The Orion Handoff is an explicit, event-driven state machine.
                Every interaction — dispatch, review, capacity refusal,
                redirect, arrival scan, and counter-referral note — generates
                an immutable, timestamped event.
              </p>
            </div>

            {/* The Handoff Lifecycle + Audit Trail — the dominant artifact */}
            <div className="bg-background rounded-lg border-2 border-primary/20 overflow-hidden">
              {/* Titlebar */}
              <div className="px-5 py-3 bg-surface-subtle border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-foreground flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-primary" />
                  HANDOFF: HF-7K2P · STATE MACHINE LIFECYCLE
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  8 verified events · Purnia District · 19 Sep 2024
                </span>
              </div>

              {/* Lifecycle horizontal track — status-encoded, non-interactive */}
              <div className="grid grid-cols-4 lg:grid-cols-8 border-b border-border text-left overflow-hidden">
                {[
                  { label: "ASSESS",        time: "10:30", phase: "done"     },
                  { label: "CREATE",        time: "10:32", phase: "done"     },
                  { label: "SEND",          time: "10:33", phase: "done"     },
                  { label: "RECEIVE",       time: "10:36", phase: "done"     },
                  { label: "REDIRECT",      time: "10:39", phase: "pivot"    },
                  { label: "ARRIVE",        time: "11:12", phase: "done"     },
                  { label: "OUTCOME",       time: "13:40", phase: "done"     },
                  { label: "RETURN NOTE",   time: "14:20", phase: "closed"   },
                ].map((step) => (
                  <div
                    key={step.label}
                    className={[
                      "p-3 text-left border-r last:border-r-0 border-border",
                      step.phase === "pivot"   ? "bg-warning/5 border-b-2 border-b-warning/60" :
                      step.phase === "closed"  ? "bg-primary/5 border-b-2 border-b-primary"    :
                      "bg-background",
                    ].join(" ")}
                  >
                    {/* Status indicator */}
                    <div className="mb-2">
                      {step.phase === "done" || step.phase === "closed" ? (
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">{step.time}</span>
                        </div>
                      ) : step.phase === "pivot" ? (
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">{step.time}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className={[
                      "font-mono text-[11px] font-bold leading-tight",
                      step.phase === "pivot"  ? "text-warning"  :
                      step.phase === "closed" ? "text-primary"  :
                      "text-foreground",
                    ].join(" ")}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Immutable Audit Trail — full width, generous rhythm on keystone events */}
              <div className="divide-y divide-border/60">
                {AUDIT_LOGS.map((log) => {
                  const isKeystone = log.event === "CANNOT_ACCEPT" || log.event === "HANDOFF_REDIRECTED" || log.event === "HANDOFF_ACCEPTED";
                  const isClosed   = log.event === "RETURN_NOTE_ADDED";
                  return (
                    <div
                      key={log.time}
                      className={[
                        "px-5 flex flex-col sm:flex-row sm:items-start gap-3 hover:bg-surface-subtle/30 transition-colors text-xs",
                        isKeystone ? "py-4 bg-surface-subtle/20" : isClosed ? "py-4 bg-primary/5" : "py-3",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3 sm:w-[580px] shrink-0">
                        <span className="font-mono tabular-nums text-muted-foreground text-[11px] w-16 shrink-0 pt-0.5">
                          {log.time}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded border shrink-0 font-semibold mt-0.5 ${log.badgeColor}`}
                        >
                          {log.badge}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground mr-2">
                            {log.facility}
                          </span>
                          <span className="text-muted-foreground">
                            {log.detail}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground sm:text-right sm:ml-auto shrink-0 pt-0.5">
                        {log.actor}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer strip */}
              <div className="px-5 py-2.5 bg-surface-subtle border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>
                  {AUDIT_LOGS.length} verified events · digitally signed · tamper-proof
                </span>
                <span className="text-success font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Loop Closed
                </span>
              </div>
            </div>

            {/* 3 operational facts below the audit trail — not cards, just inline */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-border pt-10">
              {[
                {
                  title: "Accept · Cannot Accept · Redirect",
                  body: "Destination desk has 3 explicit clinical decisions. Each reserves capacity, requires a reason code, or auto-reroutes with full operational history.",
                },
                {
                  title: "Arrival &amp; No-Show Tracking",
                  body: "If an accepted patient fails to arrive within the calculated transit window, the supervisor dashboard triggers an overdue alert.",
                },
                {
                  title: "Closed-Loop Return Notes",
                  body: "Upon discharge, the treating hospital transmits outcome summary and follow-up instructions back to the originating CHO.",
                },
              ].map((fact) => (
                <div key={fact.title} className="space-y-1.5">
                  <h3
                    className="text-sm font-bold text-foreground"
                    dangerouslySetInnerHTML={{ __html: fact.title }}
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {fact.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION D — PROOF
            Archetype: Dense operational detail — Capabilities + Freshness merged
            Two-column: left = structured packet, right = capability register
        ═══════════════════════════════════════════════════════════ */}
        <section
          id="proof"
          className="py-16 border-b border-border bg-surface-subtle/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
                Structured clinical handoffs, not unstructured messages.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Informal phone calls fail when duty shifts rotate or networks
                drop. Orion establishes standardized data structures for
                clinical continuity — and shows the honest verification age of
                every facility capability.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left — Structured Handoff Packet (7 cols) */}
              <div className="lg:col-span-7 bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 bg-surface-subtle border-b border-border flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase">
                      Standardized Clinical Payload
                    </span>
                    <h3 className="text-sm font-bold text-foreground">
                      Structured Handoff Packet
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground px-2 py-1 bg-surface-subtle rounded border border-border">
                    TOKEN: HF-7K2P
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Patient summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-subtle/40 p-3 rounded border border-border">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Patient Ref
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        PT-88319 (P-4402)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Demographics
                      </span>
                      <span className="font-semibold text-foreground">
                        Female, 24y (G1P0)
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        ABHA Identity
                      </span>
                      <span className="font-mono text-foreground">
                        91-4402-8819-2041
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Protocol
                      </span>
                      <span className="font-mono font-bold text-danger">
                        OBS-02 (Level 1)
                      </span>
                    </div>
                  </div>

                  {/* Vitals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        Clinical Parameters — Origin
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        Verified 10:30 AM
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded border border-danger/30 bg-danger/5">
                        <span className="text-muted-foreground text-[10px] block">
                          BLOOD PRESSURE
                        </span>
                        <span className="font-bold text-danger">
                          162 / 108 mmHg
                        </span>
                      </div>
                      <div className="p-2 rounded border border-danger/30 bg-danger/5">
                        <span className="text-muted-foreground text-[10px] block">
                          URINE PROTEIN
                        </span>
                        <span className="font-bold text-danger">
                          3+ (Dipstick)
                        </span>
                      </div>
                      <div className="p-2 rounded border border-border bg-surface-subtle/30">
                        <span className="text-muted-foreground text-[10px] block">
                          FETAL HEART RATE
                        </span>
                        <span className="font-bold text-foreground">
                          144 bpm
                        </span>
                      </div>
                      <div className="p-2 rounded border border-border bg-surface-subtle/30">
                        <span className="text-muted-foreground text-[10px] block">
                          GESTATIONAL AGE
                        </span>
                        <span className="font-bold text-foreground">
                          34 Weeks 2 Days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-referral interventions */}
                  <div className="p-3 rounded border border-border bg-surface-subtle/30 space-y-2 text-xs">
                    <span className="font-mono text-[11px] font-semibold text-foreground block">
                      PRE-REFERRAL INTERVENTIONS ADMINISTERED:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-muted-foreground">
                      {[
                        "Loading dose MgSO4 (4g IV + 10g IM)",
                        "Oral Nifedipine 10mg given",
                        "IV Line 18G secured (Ringer Lactate)",
                        "Escort: ASHA Worker Sunita Devi",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-success shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* QR footer */}
                  <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded border border-border bg-surface-subtle">
                        <QrCode className="h-6 w-6 text-foreground" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-semibold text-foreground block">
                          Offline Verification QR
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          Verify arrival with zero hospital connectivity
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      HMAC-SHA256 SIGNED
                    </span>
                  </div>
                </div>
              </div>

              {/* Right — Capability Freshness Register (5 cols) */}
              <div className="lg:col-span-5 bg-background rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 bg-surface-subtle border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">
                    CHC Purnia · Capability Register
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    No fake "live telemetry" — explicit human attestation age
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {[
                    {
                      name: "Emergency Caesarean (ObGyn)",
                      badge: "AVAILABLE",
                      badgeColor: "bg-success/10 text-success border-success/20",
                      desc: "On-call obstetrician available for emergency surgical delivery.",
                      attested: "Dr. S. Verma",
                      age: "26h ago",
                      ageColor: "text-muted-foreground",
                    },
                    {
                      name: "Blood Storage Unit (PRBC / FFP)",
                      badge: "AVAILABLE",
                      badgeColor: "bg-success/10 text-success border-success/20",
                      desc: "O-negative and B-positive units stocked for PPH protocol.",
                      attested: "Lab Tech R. Soren",
                      age: "4h ago",
                      ageColor: "text-success font-semibold",
                    },
                    {
                      name: "Major Operating Theatre (OT)",
                      badge: "UNAVAILABLE",
                      badgeColor: "bg-danger/10 text-danger border-danger/20",
                      desc: "Autoclave maintenance cycle. Major cases must divert to DH.",
                      attested: "Nurse In-Charge M. Devi",
                      age: "3d ago",
                      ageColor: "text-danger font-semibold",
                      rowBg: "bg-danger/5",
                    },
                    {
                      name: "Ultrasonography (USG Obstetric)",
                      badge: "STALE > 7 DAYS",
                      badgeColor:
                        "bg-surface-subtle text-muted-foreground border-border",
                      desc: "Sonologist visiting schedule not confirmed for current week.",
                      attested: "System Auto-Flag",
                      age: "8d ago",
                      ageColor: "text-warning font-semibold",
                    },
                  ].map((cap) => (
                    <div
                      key={cap.name}
                      className={`p-4 flex flex-col gap-2 text-xs ${cap.rowBg ?? ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-foreground text-sm leading-tight">
                          {cap.name}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${cap.badgeColor}`}
                        >
                          {cap.badge}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {cap.desc}
                      </p>
                      <div className="font-mono text-[11px] flex items-center justify-between">
                        <span className="text-foreground">{cap.attested}</span>
                        <span className={cap.ageColor}>
                          Verified {cap.age}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION E — CONTEXT
            Archetype: Lighter supporting — Offline + Architecture merged
            Side-by-side two independent but related operational facts
        ═══════════════════════════════════════════════════════════ */}
        <section id="context" className="py-16 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
                Engineered for rural reality.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Orion operates with a local-first offline engine and integrates
                cleanly with existing national health infrastructure — without
                replacing it.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Offline reality */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="flex border-b border-border bg-surface-subtle text-xs font-mono">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOfflineTab === "offline"}
                    aria-controls="offline-panel"
                    id="tab-offline"
                    onClick={() => setActiveOfflineTab("offline")}
                    className={`flex-1 px-4 py-2.5 flex items-center gap-2 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                      activeOfflineTab === "offline"
                        ? "bg-background text-danger font-bold border-b-2 border-b-danger"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <WifiOff className="h-3.5 w-3.5 shrink-0" />
                    <span>Field Offline</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOfflineTab === "online"}
                    aria-controls="online-panel"
                    id="tab-online"
                    onClick={() => setActiveOfflineTab("online")}
                    className={`flex-1 px-4 py-2.5 flex items-center gap-2 border-l border-border transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                      activeOfflineTab === "online"
                        ? "bg-background text-success font-bold border-b-2 border-b-success"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wifi className="h-3.5 w-3.5 shrink-0" />
                    <span>Connectivity Restored</span>
                  </button>
                </div>

                <div 
                  className="p-5"
                  role="tabpanel"
                  id={activeOfflineTab === "offline" ? "offline-panel" : "online-panel"}
                  aria-labelledby={activeOfflineTab === "offline" ? "tab-offline" : "tab-online"}
                >
                  {activeOfflineTab === "offline" ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 font-mono text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-danger motion-safe:animate-pulse" />
                        NETWORK INTERRUPTED · LOCAL PERSISTENCE
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">
                          Handoff Created Locally (Offline Mode)
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Clinical validation rules and triage scoring execute
                          in-browser. The secure patient QR token renders
                          instantaneously so the physical backup travels with the
                          patient immediately.
                        </p>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center gap-2 text-success">
                          <Check className="h-3.5 w-3.5" />
                          <span>Clinical protocol validation: PASSED (OBS-02)</span>
                        </div>
                        <div className="flex items-center gap-2 text-success">
                          <Check className="h-3.5 w-3.5" />
                          <span>Offline QR token generated</span>
                        </div>
                        <div className="flex items-center gap-2 text-warning">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Outbox queue: 1 packet pending sync</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-mono text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        CELLULAR ACTIVE · DETERMINISTIC OUTBOX DRAIN
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">
                          Server Reconciliation &amp; Broadcast
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Background sync engine drains the local outbox. Server
                          processes the idempotent UUID key without duplicating
                          records and dispatches real-time alerts to the
                          receiving desk.
                        </p>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center gap-2 text-success">
                          <Check className="h-3.5 w-3.5" />
                          <span>Server response: HTTP 201 CREATED</span>
                        </div>
                        <div className="flex items-center gap-2 text-success">
                          <Check className="h-3.5 w-3.5" />
                          <span>Idempotent deduplication: 0 duplicates</span>
                        </div>
                        <div className="flex items-center gap-2 text-success">
                          <Check className="h-3.5 w-3.5" />
                          <span>Destination terminal alerted in 420ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Architecture */}
              <div className="bg-card rounded-lg border border-border p-5 space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Orion coordinates. It does not replace.
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Orion is not an EMR or hospital management suite. It is the
                    dedicated referral coordination layer connecting existing
                    national registries and destination desks.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-mono text-[11px] uppercase text-muted-foreground block">
                    Upstream Ecosystem
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "ABDM / ABHA", desc: "Patient Digital ID" },
                      { name: "eSanjeevani", desc: "Teleconsultation" },
                      { name: "HMIS / RCH", desc: "Registry Reporting" },
                      { name: "Facility EMRs", desc: "State &amp; Local Systems" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="p-2.5 rounded border border-border bg-surface-subtle"
                      >
                        <span className="font-mono font-bold text-foreground block text-xs">
                          {item.name}
                        </span>
                        <span
                          className="text-[11px] text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: item.desc }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="p-3.5 rounded border-2 border-primary/30 bg-surface-subtle space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="font-mono text-xs font-bold text-foreground">
                      ORION REFERRAL COORDINATION ENGINE
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      "1. Protocol Triage",
                      "2. State Transition",
                      "3. Closed Loop Sync",
                    ].map((step) => (
                      <div
                        key={step}
                        className="p-2 rounded bg-background border border-border text-center text-[11px] font-semibold text-foreground"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded border border-border bg-background flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Safe, Timely &amp; Accountable Care Transition
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    FHIR R4 Export
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION F — DEPLOYMENT
            Archetype: Closing — Facility tiers + Roles + CTA combined
            Dense but final, leads naturally to the single CTA
        ═══════════════════════════════════════════════════════════ */}
        <section
          id="deployment"
          className="py-16 border-b border-border bg-surface-subtle/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-3">
                Purpose-built interfaces for each health cadre.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Rather than overloading frontline workers with enterprise menus,
                Orion delivers role-tailored interfaces strictly bound to
                facility boundaries.
              </p>
            </div>

            {/* Facility tiers — compact horizontal */}
            <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-0 rounded border border-border overflow-hidden divide-x divide-border text-xs">
              {[
                {
                  tier: "TIER 1 · PRIMARY",
                  name: "Ayushman Arogya Mandir",
                  staff: "CHO &amp; ANM",
                  action: "Origin Triage",
                  actionColor: "text-foreground",
                  conn: "Offline Capable",
                  highlight: false,
                },
                {
                  tier: "TIER 2 · LOCAL CARE",
                  name: "Primary Health Centre",
                  staff: "General MO",
                  action: "Triage &amp; Reroute",
                  actionColor: "text-foreground",
                  conn: "&lt; 20 min transit",
                  highlight: false,
                },
                {
                  tier: "TIER 3 · FRU",
                  name: "Community Health Centre",
                  staff: "Caesarean &amp; Blood",
                  action: "Accept / Redirect",
                  actionColor: "text-foreground font-semibold",
                  conn: "Immediate Reservation",
                  highlight: true,
                },
                {
                  tier: "TIER 4 · TERTIARY",
                  name: "District Hospital",
                  staff: "HDU, NICU, Blood Bank",
                  action: "Specialist Standby",
                  actionColor: "text-foreground",
                  conn: "Discharge Note to CHO",
                  highlight: false,
                },
              ].map((tier) => (
                <div
                  key={tier.tier}
                  className={`p-4 space-y-2 ${
                    tier.highlight
                      ? "bg-primary/5 border-t-2 border-t-primary"
                      : "bg-background"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      tier.highlight ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {tier.tier}
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">
                      {tier.name}
                    </h3>
                    <p
                      className="text-muted-foreground text-[11px] mt-0.5"
                      dangerouslySetInnerHTML={{ __html: tier.staff }}
                    />
                  </div>
                  <div className="border-t border-border pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Orion Action</span>
                      <span
                        className={`font-mono ${tier.actionColor}`}
                        dangerouslySetInnerHTML={{ __html: tier.action }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Connectivity</span>
                      <span
                        className="font-mono text-foreground text-right"
                        dangerouslySetInnerHTML={{ __html: tier.conn }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Role cards — lighter, no eyebrow label pattern */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  roleTag: "ORIGIN",
                  roleColor: "text-primary",
                  badge: "Frontline Cadre",
                  title: "CHO / ANM / Medical Officer",
                  sub: "Ayushman Arogya Mandirs &amp; Sub-Centres",
                  action:
                    "Performs rapid protocol assessment, initiates structured Handoff, prints physical QR referral slip, and monitors transit status.",
                  receives:
                    "Inpatient counter-referral notes and discharge summaries.",
                  linkText: "Launch Origin Workspace",
                },
                {
                  roleTag: "DESTINATION",
                  roleColor: "text-foreground",
                  badge: "Hospital Desk",
                  title: "Triage Desk &amp; Emergency MO",
                  sub: "CHC, Sub-Divisional &amp; District Hospitals",
                  action:
                    "Reviews incoming referral queue, confirms bed reservation or specialist availability, scans arrival QR token at gate.",
                  receives:
                    "Post-treatment discharge submission queue from serving facility.",
                  linkText: "Launch Destination Inbox",
                },
                {
                  roleTag: "SUPERVISOR",
                  roleColor: "text-foreground",
                  badge: "Governance",
                  title: "Civil Surgeon &amp; District Health Officer",
                  sub: "District Health Society &amp; State Cell",
                  action:
                    "Monitors bottleneck facilities, tracks excessive redirect rates, flags stalled transitions, and audits transit mortality.",
                  receives:
                    "Timely capability attestations and adherence to referral protocols.",
                  linkText: "Launch Supervisor Portal",
                },
              ].map((role) => (
                <div
                  key={role.roleTag}
                  className="p-5 rounded-lg border border-border bg-background space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[11px] font-bold ${role.roleColor}`}
                    >
                      ROLE: {role.roleTag}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-foreground border border-border">
                      {role.badge}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="text-sm font-bold text-foreground"
                      dangerouslySetInnerHTML={{ __html: role.title }}
                    />
                    <p
                      className="text-xs text-muted-foreground mt-0.5"
                      dangerouslySetInnerHTML={{ __html: role.sub }}
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Action:</strong>{" "}
                      {role.action}
                    </p>
                    <p>
                      <strong className="text-foreground">Receives:</strong>{" "}
                      {role.receives}
                    </p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      <span>{role.linkText}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            CTA — Closing, left-aligned, institutional tone
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-16 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Ready to verify care coordination workflows?
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sign in with your assigned facility credentials to test the
                  Origin triage desk, Destination inbox, or District supervision
                  dashboard.
                </p>
              </div>
              <div className="shrink-0">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded border border-primary shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                  <span>Enter Staff Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-surface-subtle border-t border-border py-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm tracking-tight">
                  ORION
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border">
                  Care Access Platform
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-md">
                Open referral coordination infrastructure for public health
                systems. Bridging primary care sub-centres to first referral
                units with immutable event auditing and closed-loop continuity.
              </p>
              <div className="text-[11px] font-mono pt-1 text-muted-foreground">
                Current Demonstration Deployment: Purnia District Sandbox
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-foreground block">
                PORTAL ENTRYPOINTS
              </span>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Staff Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login?redirect=/app"
                    className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Origin Workspace
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login?redirect=/inbox"
                    className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Destination Desk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login?redirect=/supervisor"
                    className="hover:text-foreground transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Supervisor Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold text-foreground block">
                STANDARDS &amp; GOVERNANCE
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>Open Standards Architecture</li>
                <li>FHIR R4 Data Model (Planned)</li>
                <li>Local-First Offline Protocol Storage</li>
                <li>Role-Based Facility Scoping</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <span>
              © {new Date().getFullYear()} Orion Referral Network ·
              Confidential Health Operations Infrastructure
            </span>
            <div className="flex items-center gap-4">
              <span className="text-success flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Network Core Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
