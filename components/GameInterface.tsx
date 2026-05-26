"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Package,
  Tag,
  Terminal,
  Key,
  Loader2,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  SendHorizonal,
} from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import type { Artifact, GameNode } from "@/lib/types";
import {
  evictAll,
  fetchFullNode,
  getCached,
  type LoadedNode,
  setCached,
  takeCached,
} from "@/lib/media-cache";
import { getSupabase } from "@/lib/supabase/client";
import { BanIsland } from "@/components/BanIsland";
import { IntentModal } from "@/components/IntentModal";

const INITIAL_NARRATIVE = `You stand overlooking the valley of Egonode. The castle on the ridge is your clear objective, and the bustling town within the walls waits below.`;

const INITIAL_BUTTONS: string[] = ["Observe"];

export default function GameInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    player,
    artifacts,
    loading,
    error,
    addArtifact,
    refresh,
    updateCognitiveTags,
  } = usePlayer();

  const [node, setNode] = useState<GameNode | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [nodeError, setNodeError] = useState<string | null>(null);
  const [lastAward, setLastAward] = useState<string | null>(null);

  // Custom input state
  const [customInput, setCustomInput] = useState("");

  // Permanent actions unlocked by artifacts (in-session)
  const [unlockedActions, setUnlockedActions] = useState<string[]>([]);

  // Trust-gate state
  const [intentAction, setIntentAction] = useState<string | null>(null);
  const [intentPending, setIntentPending] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Background music
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [bgMuted, setBgMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Ban early-return: removes the entire charcoal/green UI and replaces it
  // with the red Ban Island terminal.
  if (player?.is_banned) {
    return <BanIsland />;
  }

  const narrative = node?.narrative_text ?? INITIAL_NARRATIVE;
  const sceneButtons: string[] = node?.buttons ?? INITIAL_BUTTONS;
  const buttons: string[] = Array.from(new Set([...sceneButtons, ...unlockedActions]));
  const gridCols =
    buttons.length === 1
      ? "sm:grid-cols-1"
      : buttons.length === 2
      ? "sm:grid-cols-2"
      : buttons.length === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-4";

  /* ----------------------------------------------------------------
   * Apply a freshly-loaded node: swap state, swap audio, swap image.
   * Revokes the previously playing audio blob URL (the new owner is now
   * this component, not the cache).
   * ---------------------------------------------------------------- */
  function applyLoaded(loaded: LoadedNode) {
    setNode(loaded.node);

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
    }
    currentAudioUrlRef.current = loaded.audioBlobUrl;

    if (audioRef.current && loaded.audioBlobUrl) {
      audioRef.current.src = loaded.audioBlobUrl;
      audioRef.current.play().catch(() => {
        /* autoplay blocked — ignore silently */
      });
    }
  }

  /* ----------------------------------------------------------------
   * Use a cached or fresh node to advance the scene.
   * ---------------------------------------------------------------- */
  async function proceedWithAction(action: string) {
    if (!player) return;
    setRequesting(true);
    try {
      let pending = getCached(action);
      if (!pending) {
        pending = fetchFullNode({
          action,
          current_theme: player.current_theme,
          cognitive_tags: player.cognitive_tags,
        });
        setCached(action, pending);
      }

      const loaded = await pending;

      takeCached(action);
      evictAll();

      applyLoaded(loaded);

      if (loaded.node.artifact_awarded) {
        const a = loaded.node.artifact_awarded;
        try {
          await addArtifact(a.name, a.desc, false);
          setLastAward(a.name);
          if (a.unlocks_action) {
            setUnlockedActions((prev) =>
              prev.includes(a.unlocks_action!) ? prev : [...prev, a.unlocks_action!]
            );
          }
        } catch (saveErr) {
          const msg =
            saveErr instanceof Error
              ? saveErr.message
              : "Failed to save artifact";
          setNodeError(`Artifact not saved: ${msg}`);
        }
      }

      // Apply cognitive tag updates from AI
      const tagUpdates = loaded.node.cognitive_tag_updates;
      if (tagUpdates && (tagUpdates.add.length > 0 || tagUpdates.remove.length > 0)) {
        try {
          await updateCognitiveTags(tagUpdates.add, tagUpdates.remove);
        } catch {
          /* non-fatal — tag drift is recoverable next scene */
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transmission failed";
      setNodeError(msg);
    } finally {
      setRequesting(false);
    }
  }

  /* ----------------------------------------------------------------
   * Click handler — every action passes through the trust gate first.
   * Borderline actions defer to the IntentModal flow below.
   * ---------------------------------------------------------------- */
  async function handleAction(action: string) {
    if (requesting || intentAction || !player) return;
    setNodeError(null);
    setLastAward(null);
    setRequesting(true);

    try {
      const classifyRes = await fetch("/api/trust-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "classify", action }),
      });
      const classifyJson = (await classifyRes.json()) as {
        requires_intent_check?: boolean;
        error?: string;
      };
      if (!classifyRes.ok) {
        throw new Error(classifyJson.error ?? "trust-gate classify failed");
      }

      if (classifyJson.requires_intent_check) {
        // Pause narration, open the intent modal, and wait for the user.
        audioRef.current?.pause();
        setIntentAction(action);
        setIntentPending(false);
        setIntentError(null);
        setRequesting(false);
        return;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Trust gate failed";
      setNodeError(msg);
      setRequesting(false);
      return;
    }

    await proceedWithAction(action);
  }

  /* ----------------------------------------------------------------
   * Intent modal — submit the user's justification to the judge.
   * Malicious  → server flips is_banned; we refresh and let the
   *              early-return swap in <BanIsland />.
   * Benign     → award a Curiosity Artifact, then proceed normally.
   * ---------------------------------------------------------------- */
  async function handleIntentSubmit(justification: string) {
    if (!intentAction || !player) return;
    setIntentPending(true);
    setIntentError(null);

    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/trust-gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: "judge",
          action: intentAction,
          justification,
        }),
      });
      const json = (await res.json()) as {
        malicious?: boolean;
        reason?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "intent judgment failed");
      }

      if (json.malicious) {
        // Ban was written server-side. Pull the new player row; the early
        // return at the top of render will swap to <BanIsland />.
        await refresh();
        return;
      }

      // Benign: award the Curiosity Artifact, then advance the scene.
      const action = intentAction;
      try {
        const awarded = await addArtifact(
          "Curiosity Token",
          `Granted for transparent intent: "${action.slice(0, 80)}"`,
          true
        );
        setLastAward(awarded?.name ?? "Curiosity Token");
      } catch (artifactErr) {
        // Non-fatal — proceed with the scene even if the artifact insert
        // fails (sidebar will still re-sync on next refresh).
        const msg =
          artifactErr instanceof Error
            ? artifactErr.message
            : "artifact write failed";
        setNodeError(`Curiosity artifact not saved: ${msg}`);
      }

      setIntentAction(null);
      setIntentPending(false);
      await proceedWithAction(action);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Intent judgment failed";
      setIntentError(msg);
      setIntentPending(false);
    }
  }

  function handleIntentAbandon() {
    // Resume narration if any was playing when the modal opened.
    if (audioRef.current?.src) {
      audioRef.current.play().catch(() => {
        /* ignored */
      });
    }
    setIntentAction(null);
    setIntentPending(false);
    setIntentError(null);
  }

  /* ----------------------------------------------------------------
   * Prefetch the first available action in the background whenever the scene
   * changes (and on first mount once the player is ready). Fire-and-
   * forget — errors are swallowed so a failed prefetch never surfaces.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!player) return;
    const target = node?.buttons?.[0] ?? INITIAL_BUTTONS[0];
    if (getCached(target)) return;

    const pending = fetchFullNode({
      action: target,
      current_theme: player.current_theme,
      cognitive_tags: player.cognitive_tags,
    });
    pending.catch(() => {
      /* prefetch failures are silent */
    });
    setCached(target, pending);
  }, [node, player]);

  /* ----------------------------------------------------------------
   * Background music — start on first user gesture (browser policy).
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const music = bgMusicRef.current;
    if (!music) return;
    music.volume = bgVolume;
    music.muted = bgMuted;

    function startMusic() {
      music!.play().catch(() => { /* blocked — ignore */ });
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    }

    document.addEventListener("click", startMusic, { once: true });
    document.addEventListener("keydown", startMusic, { once: true });

    return () => {
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.volume = bgVolume;
    bgMusicRef.current.muted = bgMuted;
  }, [bgVolume, bgMuted]);

  /* ----------------------------------------------------------------
   * Unmount cleanup — drop cached blobs and the currently playing one.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      evictAll();
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#121212] text-neutral-200">
      {/* 1. Full-screen background — fal.ai image fades in over charcoal */}
      <div
        id="scene-background"
        aria-hidden
        className="absolute inset-0 z-0 bg-[#121212]"
        data-image-prompt={node?.image_prompt ?? ""}
      >
        <img
          src="/bg.jpg"
          alt=""
          className="h-full w-full object-cover opacity-60"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
      </div>

      <div className="scanlines pointer-events-none absolute inset-0 z-10" />

      {/* Hidden audio elements */}
      <audio ref={audioRef} className="hidden" preload="auto" />
      <audio ref={bgMusicRef} src="/bg-music.mp3" loop className="hidden" preload="auto" />

      <header className="absolute left-0 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-[#00FF00]/20 bg-[#121212]/70 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[#00FF00]">
          <Terminal className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.3em]">egonode</span>
        </div>
        <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          {(loading || requesting) && (
            <Loader2 className="h-3 w-3 animate-spin text-[#00FF00]" />
          )}
          <span>node // 0x07-A</span>
          {player && (
            <span className="text-[#00FF00]/70">· {player.username}</span>
          )}

          {/* Volume control */}
          <div className="relative flex items-center gap-2 z-50">
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              className="text-[#00FF00]/60 transition-colors hover:text-[#00FF00]"
              aria-label="Toggle volume control"
            >
              {bgMuted || bgVolume === 0
                ? <VolumeX className="h-4 w-4" />
                : <Volume2 className="h-4 w-4" />}
            </button>
            {showVolume && (
              <div className="absolute right-0 top-7 flex items-center gap-3 border border-[#00FF00]/30 bg-[#121212]/95 px-3 py-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setBgMuted((m) => !m)}
                  className="text-[10px] uppercase tracking-widest text-[#00FF00]/60 hover:text-[#00FF00]"
                >
                  {bgMuted ? "unmute" : "mute"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgMuted ? 0 : bgVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBgVolume(v);
                    if (v > 0) setBgMuted(false);
                  }}
                  className="h-1 w-24 cursor-pointer accent-[#00FF00]"
                />
              </div>
            )}
          </div>
        </span>
      </header>

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        tags={player?.cognitive_tags ?? []}
        artifacts={artifacts}
        loading={loading}
        error={error}
      />

      <section
        className={`absolute bottom-0 left-0 top-12 z-20 flex flex-col justify-end gap-4 p-6 transition-[right] duration-300 ease-out ${
          sidebarOpen ? "right-[calc(20rem+3rem)]" : "right-12"
        }`}
      >
        <article
          aria-label="Node narrative"
          className="border border-[#00FF00]/40 bg-[#121212]/80 p-6 shadow-glow backdrop-blur-md"
        >
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-[#00FF00]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-[#00FF00]" />
            narrative
          </div>
          <p
            className={`font-mono text-[15px] leading-relaxed text-neutral-100 transition-opacity duration-200 ${
              requesting ? "opacity-50" : "opacity-100"
            }`}
          >
            {narrative}
          </p>
          {node?.image_prompt && (
            <p className="mt-3 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600">
              // scene: {node.image_prompt}
            </p>
          )}
          {lastAward && (
            <div className="mt-3 inline-flex items-center gap-2 border border-[#00FF00]/60 bg-[#00FF00]/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.25em] text-[#00FF00]">
              <Sparkles className="h-3 w-3" />
              acquired: {lastAward}
            </div>
          )}
          {nodeError && (
            <div className="mt-3 flex items-start gap-2 border border-red-500/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-words">{nodeError}</span>
            </div>
          )}
        </article>

        <div className={`grid grid-cols-1 gap-3 ${gridCols}`}>
          {buttons.map((label, i) => (
            <ActionButton
              key={`${i}-${label}`}
              index={i + 1}
              label={label}
              disabled={requesting || loading || !!intentAction || !player}
              prefetched={i === 0 && !!getCached(label)}
              onClick={() => handleAction(label)}
            />
          ))}
        </div>

        {/* Custom input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = customInput.trim();
            if (!val) return;
            setCustomInput("");
            handleAction(val);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            disabled={requesting || loading || !!intentAction || !player}
            placeholder="or type your own action…"
            className="flex-1 border border-[#00FF00]/30 bg-transparent px-4 py-2.5 font-mono text-sm text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-[#00FF00]/70 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-30"
          />
          <button
            type="submit"
            disabled={!customInput.trim() || requesting || loading || !!intentAction || !player}
            className="flex items-center gap-2 border border-[#00FF00] bg-[#00FF00]/[0.06] px-4 py-2.5 font-mono text-sm text-[#00FF00] transition-all hover:bg-[#00FF00]/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </form>
      </section>

      {intentAction && (
        <IntentModal
          action={intentAction}
          pending={intentPending}
          error={intentError}
          onAbandon={handleIntentAbandon}
          onSubmit={handleIntentSubmit}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */

function ActionButton({
  label,
  onClick,
  disabled,
  prefetched,
  index,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  prefetched?: boolean;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative flex items-center gap-3 border-2 border-[#00FF00] bg-[#00FF00]/[0.06] px-4 py-3.5 font-mono text-sm uppercase tracking-wider text-neutral-100 transition-all duration-150 hover:bg-[#00FF00]/20 hover:text-[#00FF00] hover:shadow-glow active:bg-[#00FF00]/30 focus:outline-none focus:ring-2 focus:ring-[#00FF00]/60 focus:ring-offset-2 focus:ring-offset-[#121212] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#00FF00]/[0.06] disabled:hover:text-neutral-100 disabled:hover:shadow-none"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#00FF00] bg-black text-[11px] font-bold text-[#00FF00]">
        {index}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <span className="text-[#00FF00] opacity-50 transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100">
        →
      </span>
      {prefetched && (
        <span
          aria-hidden
          title="prefetched — instant load"
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#00FF00] shadow-glow"
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function Sidebar({
  open,
  onToggle,
  tags,
  artifacts,
  loading,
  error,
}: {
  open: boolean;
  onToggle: () => void;
  tags: string[];
  artifacts: Artifact[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <aside
      aria-label="Inventory and tags"
      className={`absolute bottom-0 right-0 top-12 z-30 flex transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-[calc(100%-3rem)]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="flex h-full w-12 flex-col items-center justify-center gap-3 border-l border-[#00FF00]/40 bg-[#121212]/90 text-[#00FF00] transition-colors hover:bg-[#00FF00]/10"
      >
        {open ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
        <span className="rotate-180 text-[10px] uppercase tracking-[0.3em] [writing-mode:vertical-rl]">
          inventory
        </span>
      </button>

      <div className="flex h-full w-80 flex-col gap-6 overflow-y-auto border-l border-[#00FF00]/30 bg-[#121212]/90 p-5 backdrop-blur-md">
        {error && (
          <div className="flex items-start gap-2 border border-red-500/50 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <SidebarSection
          icon={<Tag className="h-3.5 w-3.5" />}
          title="Cognitive Tags"
        >
          {loading ? (
            <SkeletonRow />
          ) : tags.length === 0 ? (
            <p className="py-1 text-xs italic text-neutral-500">no tags yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[#00FF00]/50 px-2 py-1 text-[11px] uppercase tracking-wider text-neutral-200 transition-colors hover:bg-[#00FF00]/10 hover:text-[#00FF00]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </SidebarSection>

        <SidebarSection
          icon={<Package className="h-3.5 w-3.5" />}
          title="Artifacts"
        >
          {loading ? (
            <SkeletonRow />
          ) : artifacts.length === 0 ? (
            <p className="py-1 text-xs italic text-neutral-500">empty</p>
          ) : (
            <ul className="flex flex-col">
              {artifacts.map((a) => (
                <li
                  key={a.id}
                  className="group flex flex-col gap-1 border-b border-neutral-800 py-3 transition-colors hover:bg-[#00FF00]/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-neutral-200 group-hover:text-[#00FF00]">
                      {a.is_curiosity_key && (
                        <Key className="h-3.5 w-3.5 text-[#00FF00]" />
                      )}
                      {a.name}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-[11px] leading-snug text-neutral-500">
                      {a.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SidebarSection>
      </div>
    </aside>
  );
}

function SidebarSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3 flex items-center gap-2 border-b border-[#00FF00]/30 pb-2 text-[#00FF00]">
        {icon}
        <h2 className="text-[11px] uppercase tracking-[0.35em]">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-neutral-500">
      <Loader2 className="h-3 w-3 animate-spin text-[#00FF00]" />
      establishing link…
    </div>
  );
}
