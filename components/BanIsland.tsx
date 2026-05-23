"use client";

import { AlertOctagon } from "lucide-react";
import { usePlayer } from "@/lib/player-context";

export function BanIsland() {
  const { player } = usePlayer();

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black text-[#FF0000]">
      {/* Inner red border + glow */}
      <div className="pointer-events-none absolute inset-0 border-2 border-[#FF0000] shadow-[inset_0_0_80px_rgba(255,0,0,0.35)]" />

      {/* Red scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(255,0,0,0.10) 3px, rgba(0,0,0,0) 4px)",
        }}
      />

      {/* Corner alarm */}
      <div className="absolute right-6 top-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#FF0000]/80">
        <span className="inline-block h-2 w-2 animate-pulse bg-[#FF0000] shadow-[0_0_8px_#FF0000]" />
        alarm
      </div>

      <div className="relative z-10 w-[min(640px,92vw)] px-8 font-mono">
        <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.4em]">
          <AlertOctagon className="h-4 w-4 animate-pulse" />
          <span>ban state active</span>
        </div>

        <h1 className="mb-10 text-5xl font-bold uppercase leading-none tracking-tight text-[#FF0000]">
          Ban Island.
        </h1>

        <div className="mb-10 space-y-2 text-sm">
          <Row label="user" value={player?.username ?? "—"} />
          <Row label="status" value="exiled" />
          <Row label="passage" value="revoked" />
        </div>

        <p className="mb-2 text-sm leading-relaxed text-[#FF0000]/80">
          The signal you sent was incompatible with continued passage.
        </p>
        <p className="text-sm leading-relaxed text-[#FF0000]/80">
          You have been removed from the active mesh. This terminal will remain
          dark.
        </p>

        <div className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#FF0000]/60">
          <span className="inline-block h-1.5 w-1.5 animate-pulse bg-[#FF0000]" />
          terminal locked
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-[#FF0000]/30 pb-1">
      <span className="w-24 text-[10px] uppercase tracking-[0.3em] text-[#FF0000]/60">
        {label}
      </span>
      <span className="text-sm uppercase tracking-wider">{value}</span>
    </div>
  );
}
