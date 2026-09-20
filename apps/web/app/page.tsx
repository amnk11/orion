"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Activity, 
  GitBranch, 
  ShieldCheck, 
  Building2, 
  Users, 
  LayoutDashboard, 
  FileText,
  Stethoscope
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {/* <Activity className="size-5 text-primary" />
              <span className="font-bold tracking-tight text-foreground">
                Sahay
              </span> */}
              <Image src="/sahay-small.svg" alt="logo" height={36} width={120}/>
              
            </div>
            {/* <div className="h-4 w-px bg-border hidden md:block" /> */}
            {/* <p className="text-xs text-muted-foreground hidden md:block font-medium">
              Clinical Referral Coordination
            </p> */}
          </div>

          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">The Problem</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Roles</a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm transition-colors"
          >
            Staff Login
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO SECTION ──────────────────────────────────────────────── */}
        <section className="border-b border-border py-24 md:py-32 bg-surface-inset/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono font-medium rounded-sm bg-primary/10 text-primary border border-primary/20">
                <Activity className="size-3.5" />
                CLINICAL REFERRAL COORDINATION
              </div>
              
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
                Coordinate patient referrals across facilities.
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Sahay connects primary care facilities with district hospitals to ensure timely, safe, and transparent patient handoffs. No blind dispatching, no lost clinical context.
              </p>
              
              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm transition-colors"
                >
                  Open Staff Portal
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Restrained Hero Visual: The Handoff Flow */}
            <div className="mt-20 p-8 rounded-lg border border-border bg-card shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -z-10" />
                
                <div className="flex flex-col items-center gap-3 bg-card px-4 z-10">
                  <div className="size-12 rounded-full border border-border bg-surface-inset flex items-center justify-center text-muted-foreground">
                    <Users className="size-6" />
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground uppercase tracking-widest text-center">Patient Context</span>
                </div>

                <div className="text-muted-foreground bg-card px-2 z-10">
                  <ArrowRight className="size-5 hidden md:block" />
                  <div className="md:hidden h-6 w-px bg-border" />
                </div>

                <div className="flex flex-col items-center gap-3 bg-card px-4 z-10">
                  <div className="size-12 rounded-full border border-border bg-surface-inset flex items-center justify-center text-primary">
                    <Building2 className="size-6" />
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground uppercase tracking-widest text-center">Origin Facility</span>
                </div>

                <div className="text-muted-foreground bg-card px-2 z-10">
                  <ArrowRight className="size-5 hidden md:block" />
                  <div className="md:hidden h-6 w-px bg-border" />
                </div>

                <div className="flex flex-col items-center gap-3 bg-card px-4 z-10">
                  <div className="size-12 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary">
                    <GitBranch className="size-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest text-center">Active Handoff</span>
                </div>

                <div className="text-muted-foreground bg-card px-2 z-10">
                  <ArrowRight className="size-5 hidden md:block" />
                  <div className="md:hidden h-6 w-px bg-border" />
                </div>

                <div className="flex flex-col items-center gap-3 bg-card px-4 z-10">
                  <div className="size-12 rounded-full border border-border bg-surface-inset flex items-center justify-center text-foreground">
                    <Building2 className="size-6" />
                  </div>
                  <span className="text-xs font-mono font-medium text-foreground uppercase tracking-widest text-center">Destination</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PROBLEM SECTION ──────────────────────────────────────────────── */}
        <section id="problem" className="py-24 border-b border-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-6">
                  The operational challenge of rural healthcare coordination.
                </h2>
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p>
                    In distributed healthcare networks, patient referrals often suffer from fragmentation. When a frontline health worker issues a paper referral slip, digital continuity ends.
                  </p>
                  <p>
                    Destination facilities receive patients without prior clinical context or advance notification. Patients may arrive at facilities lacking the required specialist capacity, resulting in delays, redirection, and loss of critical time.
                  </p>
                  <p>
                    Sahay replaces informal, disconnected referral mechanisms with an explicit, trackable state machine, ensuring every patient transition is accounted for.
                  </p>
                </div>
              </div>
              <div className="bg-surface-inset rounded-lg border border-border p-8 flex flex-col justify-center gap-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 size-8 rounded border border-border bg-card flex items-center justify-center shrink-0">
                    <span className="text-danger font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Loss of Clinical Context</h4>
                    <p className="text-sm text-muted-foreground mt-1">Paper records degrade or are lost in transit, forcing destination staff to reassess from zero.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 size-8 rounded border border-border bg-card flex items-center justify-center shrink-0">
                    <span className="text-danger font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Blind Dispatching</h4>
                    <p className="text-sm text-muted-foreground mt-1">Patients are sent to facilities without confirmation of bed availability or operational capability.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 size-8 rounded border border-border bg-card flex items-center justify-center shrink-0">
                    <span className="text-danger font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Broken Follow-up</h4>
                    <p className="text-sm text-muted-foreground mt-1">Originating clinics rarely receive outcome or discharge information for community follow-up.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WORKFLOW SECTION ──────────────────────────────────────────────── */}
        <section id="workflow" className="py-24 border-b border-border bg-surface-inset/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-4">
                How Sahay Works
              </h2>
              <p className="text-muted-foreground text-lg">
                A structured, chronological approach to patient handoffs.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { step: "01", title: "Assess", desc: "Capture structured patient vitals and clinical danger signs." },
                { step: "02", title: "Route", desc: "Identify an appropriate destination facility." },
                { step: "03", title: "Refer", desc: "Create and dispatch the handoff with full clinical context." },
                { step: "04", title: "Handoff", desc: "Destination staff review, accept, or safely redirect." },
                { step: "05", title: "Follow Through", desc: "Maintain visibility across the entire referral lifecycle." }
              ].map((item, i) => (
                <div key={item.step} className="flex flex-col bg-card p-6 rounded-lg border border-border">
                  <span className="font-mono text-sm font-bold text-muted-foreground mb-4">{item.step}</span>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CAPABILITIES ──────────────────────────────────────────────── */}
        <section id="capabilities" className="py-24 border-b border-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-4">
                Core Capabilities
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Operational tools designed strictly for healthcare referral management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Stethoscope, title: "Clinical Assessment", desc: "Standardized intake forms capturing specific vitals and danger signs for precise urgency calculation." },
                { icon: GitBranch, title: "Referral Coordination", desc: "Explicit state tracking (Sent, Accepted, Redirected) ensuring accountability at every step." },
                { icon: Building2, title: "Facility Routing", desc: "Directory-based selection allowing frontline workers to route patients to the correct tier of care." },
                { icon: FileText, title: "Clinical Context", desc: "Transmission of structured clinical data so receiving doctors can prepare before the patient arrives." },
                { icon: Activity, title: "Handoff Tracking", desc: "A chronological timeline of operational events, recording exactly when and by whom decisions are made." },
                { icon: LayoutDashboard, title: "Follow-up Visibility", desc: "Originating facilities maintain access to the status of their referred patients for community continuity." }
              ].map((cap) => (
                <div key={cap.title} className="space-y-4">
                  <div className="size-10 rounded border border-border bg-surface-inset flex items-center justify-center text-primary">
                    <cap.icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CLINICAL TRUST ──────────────────────────────────────────────── */}
        <section className="py-24 border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-6 text-center max-w-3xl">
            <ShieldCheck className="size-12 mx-auto text-primary mb-6" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
              Designed with reference to established standards.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Sahay's data structures and workflows are designed with reference to clinical guidelines including WHO IMNCI and the Indian Public Health Standards (IPHS).
              Architecture accommodates future interoperability with ABDM and FHIR standards.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border bg-surface-inset text-xs text-muted-foreground font-mono">
              Note: Sahay is a technical coordination tool, not a substitute for clinical judgment.
            </div>
          </div>
        </section>

        {/* ─── ROLES ──────────────────────────────────────────────── */}
        <section id="roles" className="py-24 border-b border-border bg-surface-inset/30">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-12">
              Role-Based Value
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card p-8 rounded-lg border border-border flex flex-col h-full">
                <span className="font-mono text-xs font-bold text-primary mb-4 uppercase tracking-widest">Origin Staff</span>
                <h3 className="text-xl font-semibold text-foreground mb-4">Community Clinics</h3>
                <ul className="space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Capture structured clinical context</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Initiate tracked referrals</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Monitor handoff acceptance</li>
                </ul>
              </div>

              <div className="bg-card p-8 rounded-lg border border-border flex flex-col h-full">
                <span className="font-mono text-xs font-bold text-primary mb-4 uppercase tracking-widest">Destination Staff</span>
                <h3 className="text-xl font-semibold text-foreground mb-4">Hospitals & FRUs</h3>
                <ul className="space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Receive incoming referrals in real-time</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Review clinical payload before arrival</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Explicitly Accept, Redirect, or Decline</li>
                </ul>
              </div>

              <div className="bg-card p-8 rounded-lg border border-border flex flex-col h-full">
                <span className="font-mono text-xs font-bold text-primary mb-4 uppercase tracking-widest">Administrators</span>
                <h3 className="text-xl font-semibold text-foreground mb-4">Supervisors</h3>
                <ul className="space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> District-wide coordination oversight</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Ensure protocol adherence</li>
                  <li className="flex gap-2"><ArrowRight className="size-4 shrink-0 text-primary mt-0.5" /> Audit referral timelines</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src="/sahay-small.svg" alt="Sahay Logo" height={36} width={120} />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Clinical referral coordination infrastructure for public health systems.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-12 sm:gap-24">
            <div className="space-y-4">
              <span className="font-mono text-xs font-bold text-foreground">PRODUCT</span>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Staff Login</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Origin Workspace</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Destination Desk</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <span className="font-mono text-xs font-bold text-foreground">SYSTEM</span>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="text-muted-foreground">Internal Documentation</span></li>
                <li><span className="text-muted-foreground">Technical Architecture</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sahay Health Systems.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Clinical Operations Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
