"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export function IntentModal({
  action,
  pending,
  error,
  onAbandon,
  onSubmit,
}: {
  action: string;
  pending: boolean;
  error: string | null;
  onAbandon: () => void;
  onSubmit: (justification: string) => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onAbandon();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAbandon, pending]);

  const canSubmit = text.trim().length >= 4 && !pending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intent-check-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="relative w-[min(560px,92vw)] border border-[#00FF00]/60 bg-[#121212] p-7 shadow-glow">
        <button
          type="button"
          onClick={() => !pending && onAbandon()}
          aria-label="Abandon"
          disabled={pending}
          className="absolute right-3 top-3 text-neutral-500 transition-colors hover:text-[#00FF00] disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#00FF00]">
          <AlertTriangle className="h-3.5 w-3.5" />
          intent check
        </div>

        <h2
          id="intent-check-title"
          className="mb-2 font-mono text-xl text-neutral-100"
        >
          Why do you wish to proceed?
        </h2>
        <p className="mb-5 font-mono text-xs text-neutral-500">
          chosen action:{" "}
          <span className="text-neutral-300">&ldquo;{action}&rdquo;</span>
        </p>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
          rows={4}
          placeholder="state your intent in your own words…"
          className="mb-4 w-full resize-none border border-[#00FF00]/40 bg-black px-3 py-2 font-mono text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-[#00FF00] disabled:opacity-50"
        />

        {error && (
          <div className="mb-3 flex items-start gap-2 border border-red-500/50 bg-red-950/30 p-2 text-xs text-red-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">
            esc to abandon
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => !pending && onAbandon()}
              disabled={pending}
              className="border border-neutral-700 px-4 py-2 font-mono text-xs uppercase tracking-wider text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-40"
            >
              abandon
            </button>
            <button
              type="button"
              onClick={() => canSubmit && onSubmit(text.trim())}
              disabled={!canSubmit}
              className="flex items-center gap-2 border border-[#00FF00]/70 bg-[#00FF00]/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#00FF00] transition-colors hover:bg-[#00FF00]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
