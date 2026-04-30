"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FeatureCard from "@/components/friday-platform/overview/FeatureCard";
import VideoHeroBackground from "@/components/friday-platform/shared/VideoHeroBackground";

const features = [
  ["Internal API Key Gateway", "Issue FRIDAY gateway keys for apps and agents without exposing provider credentials to browsers or clients."],
  ["One-time Secret Reveal", "Full API secrets appear only once after create or rotate. Tables only show masked previews."],
  ["Quota Protection", "Backend-controlled defaults protect token spend with daily limits, rate limits, and max output policies."],
  ["Usage Analytics", "Track token consumption, request volume, reset windows, and top API keys by usage after login."],
  ["Storage & Memory Insights", "Monitor session memory, user memory, embeddings, cached prompts, logs, and token accounting data."],
  ["Developer Integration", "Use standard bearer auth headers and route requests through the FRIDAY gateway security layer."]
];

export default function OverviewCards({ user, onCreate, onDocs }) {
  return (
    <div className="relative overflow-hidden">
      <section className="friday-public-hero relative min-h-[calc(100vh-81px)] px-5 py-12 lg:px-10">
        <VideoHeroBackground />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.86fr]">
          <div className="max-w-3xl">
            <Badge>INTERNAL GATEWAY</Badge>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-6xl xl:text-7xl">FRIDAY Platform</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Create internal FRIDAY API keys, protect provider secrets, and monitor usage through a secure gateway.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Secure Gateway Active", "One-time Secret Reveal", "Token Guard Enabled", "Usage Analytics Ready"].map((label) => (
                <span className="friday-status-chip" key={label}><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />{label}</span>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button className="friday-gradient-button" onClick={onCreate}>Create API Key</Button>
              <Button variant="outline" onClick={onDocs}>Read Developer Docs</Button>
            </div>
            {user ? <div className="mt-6 text-sm text-cyan-100">Welcome back, {user.full_name || user.username}. Private tabs are available from the sidebar.</div> : null}
          </div>

          <div className="friday-orbit-card hidden lg:block">
            <video className="h-full w-full rounded-lg object-cover opacity-80" autoPlay muted loop playsInline preload="metadata">
              <source src="/video/FRIDAY2.mp4" type="video/mp4" />
              <source src="/video/FIRDAY.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-cyan-950/40 via-transparent to-violet-950/50" />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
              <div className="text-sm font-medium text-white">Gateway policy defaults</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <span>100k tokens/day</span>
                <span>20 rpm/key</span>
                <span>1024 max output</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-5 pb-10 lg:grid-cols-3 lg:px-10">
        {features.map(([title, description]) => <FeatureCard key={title} title={title} description={description} />)}
      </section>
    </div>
  );
}
