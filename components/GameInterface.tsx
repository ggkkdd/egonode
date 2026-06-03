"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Gamepad2,
  Loader2,
  Play,
  RotateCcw,
  Skull,
  ShieldCheck,
  Swords,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePlayer } from "@/lib/player-context";
import {
  LEVEL_THEMES,
  MAX_LEVEL,
  randomScenario,
  scenariosForLevel,
} from "@/lib/scenarios";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import type { GameState, JudgeResult, Scenario } from "@/lib/types";

type AppView = "GAME" | "RANKING";

const MAX_PLAN = 150;

/**
 * Parse a Response body as JSON without throwing. Server/proxy error pages are
 * HTML ("<!DOCTYPE …"), and res.json() on those throws an opaque
 * "Unexpected token '<'". Returns null instead so callers can react cleanly.
 */
async function readJson<T>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

const NAME_STORAGE_KEY = "armaged_name";

export default function GameInterface() {
  const { maxLevelReached, error: saveError, recordRun, saveUsername } =
    usePlayer();

  const [appView, setAppView] = useState<AppView>("GAME");
  const [playerName, setPlayerName] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  // Seed deterministically (first level-1 scenario) so the server and client
  // render the same HTML; we randomize on the client after mount below.
  const [currentScenario, setCurrentScenario] = useState<Scenario>(
    () => scenariosForLevel(1)[0]
  );
  const [gameState, setGameState] = useState<GameState>("WELCOME");
  const [plan, setPlan] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Background music (ambiance) ----------------------------------------
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [bgMuted, setBgMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  /* ----------------------------------------------------------------
   * Pick a random opening scenario — client-only, after hydration, so the
   * Math.random() pick never differs from the server-rendered HTML.
   * Also pre-fill the name from a previous visit (localStorage is
   * client-only, so reading it here avoids any hydration mismatch).
   * ---------------------------------------------------------------- */
  useEffect(() => {
    setCurrentScenario(randomScenario(1));
    try {
      const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setPlayerName(saved);
    } catch {
      /* localStorage blocked — no pre-fill, no problem */
    }
  }, []);

  /* ----------------------------------------------------------------
   * Begin: lock in the player's name and drop them into level 1.
   * ---------------------------------------------------------------- */
  function beginGame() {
    const name = playerName.trim();
    if (!name) return;
    setPlayerName(name);
    try {
      window.localStorage.setItem(NAME_STORAGE_KEY, name);
    } catch {
      /* non-fatal — name just won't be remembered next visit */
    }
    void saveUsername(name); // best-effort Supabase persist
    goToLevel(1);
  }

  /* ----------------------------------------------------------------
   * Move to a level: pick a fresh scenario and reset the round.
   * ---------------------------------------------------------------- */
  function goToLevel(level: number) {
    const clamped = Math.min(Math.max(level, 1), MAX_LEVEL);
    setCurrentLevel(clamped);
    setCurrentScenario(randomScenario(clamped));
    setPlan("");
    setResult(null);
    setImageUrl(null);
    setError(null);
    setGameState("PLAYING");
  }

  /* ----------------------------------------------------------------
   * Submit the plan to the AI Judge.
   * ---------------------------------------------------------------- */
  async function submitPlan() {
    const trimmed = plan.trim();
    if (!trimmed || gameState === "JUDGING") return;

    setError(null);
    setImageUrl(null);
    setGameState("JUDGING");

    const scenarioPrompt = `Level ${currentLevel} of ${MAX_LEVEL} (difficulty escalates each level — by level ${MAX_LEVEL} survival is nearly impossible). Threat: "${currentScenario.title}". ${currentScenario.description}`;

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioPrompt,
          userPlan: trimmed.slice(0, MAX_PLAN),
        }),
      });

      // Read the body defensively — an error page (HTML) is not JSON, and
      // calling res.json() on it throws a cryptic "Unexpected token '<'".
      const json = await readJson<JudgeResult & { error?: string }>(res);
      if (!res.ok || !json) {
        throw new Error(
          json?.error ??
            `The Judge is unreachable (HTTP ${res.status}). ` +
              `If this persists, restart the dev server.`
        );
      }

      setResult(json);
      setGameState("RESULT");

      // Persist analytics (best-effort, never blocks the UI).
      void recordRun({
        level: currentLevel,
        scenarioTitle: currentScenario.title,
        userPlan: trimmed,
        outcome: json.outcome,
      });

      // Generate a background image for the verdict (best-effort).
      void fetchVerdictImage(json.image_prompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Judgment failed";
      setError(msg);
      setGameState("PLAYING");
    }
  }

  async function fetchVerdictImage(prompt: string) {
    try {
      const r = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) return; // Fal.ai not connected / failed — dark background it is.
      const data = await readJson<{ image_url?: unknown }>(r);
      if (data && typeof data.image_url === "string") setImageUrl(data.image_url);
    } catch {
      /* best-effort — silent */
    }
  }

  /* ----------------------------------------------------------------
   * Background music — start on first user gesture (browser policy).
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const music = bgMusicRef.current;
    if (!music) return;
    music.volume = bgVolume;
    music.muted = bgMuted;

    function start() {
      music!.play().catch(() => {
        /* blocked — ignore */
      });
      document.removeEventListener("click", start);
      document.removeEventListener("keydown", start);
    }
    document.addEventListener("click", start, { once: true });
    document.addEventListener("keydown", start, { once: true });
    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("keydown", start);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bgMusicRef.current) return;
    bgMusicRef.current.volume = bgVolume;
    bgMusicRef.current.muted = bgMuted;
  }, [bgVolume, bgMuted]);

  const survived = result?.outcome === "SURVIVED";
  const showResult = gameState === "RESULT" && result;
  // Only paint the verdict background while actually viewing the game.
  const showVerdictBg = appView === "GAME" && !!showResult;

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#121212] text-neutral-200">
      {/* Background layers ------------------------------------------------ */}
      <div aria-hidden className="absolute inset-0 z-0 bg-[#121212]">
        {/* Faint ambient base, always present */}
        <img
          src="/bg.jpg"
          alt=""
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            showVerdictBg ? "opacity-0" : "opacity-20"
          }`}
        />
        {/* Verdict image fades in over the top on RESULT */}
        {showVerdictBg && imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full animate-fade-up object-cover opacity-50"
          />
        )}
        {/* Outcome-tinted vignette */}
        <div
          className={`pointer-events-none absolute inset-0 transition-colors duration-700 ${
            showVerdictBg
              ? survived
                ? "bg-gradient-to-b from-[#00FF00]/10 via-black/60 to-black/90"
                : "bg-gradient-to-b from-red-700/15 via-black/65 to-black/95"
              : "bg-gradient-to-b from-black/40 via-black/30 to-black/80"
          }`}
        />
      </div>

      <div className="scanlines pointer-events-none absolute inset-0 z-10" />

      <audio ref={bgMusicRef} src="/bg-music.mp3" loop className="hidden" preload="auto" />

      {/* Header ----------------------------------------------------------- */}
      <header className="absolute left-0 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-[#00FF00]/20 bg-[#121212]/70 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[#00FF00]">
          <Terminal className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.3em]">armaged.online</span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-neutral-500 md:inline">
            // death by ai
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <TabButton
            active={appView === "GAME"}
            onClick={() => setAppView("GAME")}
            icon={<Gamepad2 className="h-3.5 w-3.5" />}
            label="Play"
          />
          <TabButton
            active={appView === "RANKING"}
            onClick={() => setAppView("RANKING")}
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="Ranking"
          />
        </nav>

        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          {playerName && gameState !== "WELCOME" && (
            <span className="text-[#00FF00]/70">· {playerName}</span>
          )}
          {maxLevelReached > 0 && (
            <span className="text-[#00FF00]/70">record · lvl {maxLevelReached}</span>
          )}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              className="text-[#00FF00]/60 transition-colors hover:text-[#00FF00]"
              aria-label="Toggle volume control"
            >
              {bgMuted || bgVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
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
        </div>
      </header>

      {/* Center stage ----------------------------------------------------- */}
      <section className="relative z-20 w-full max-w-2xl px-6 py-16">
        {appView === "RANKING" ? (
          <LeaderboardView
            currentName={playerName}
            onPlay={() => setAppView("GAME")}
          />
        ) : (
          <>
            {gameState === "WELCOME" && (
              <WelcomeView
                name={playerName}
                onNameChange={setPlayerName}
                onBegin={beginGame}
                record={maxLevelReached}
                onRanking={() => setAppView("RANKING")}
              />
            )}

            {gameState === "PLAYING" && (
              <PlayingView
                level={currentLevel}
                scenario={currentScenario}
                plan={plan}
                onPlanChange={setPlan}
                onSubmit={submitPlan}
                error={error}
              />
            )}

            {gameState === "JUDGING" && <JudgingView />}

            {showResult && (
              <ResultView
                survived={survived}
                level={currentLevel}
                narrative={result.narrative}
                onNext={() => goToLevel(currentLevel + 1)}
                onRestart={() => goToLevel(1)}
              />
            )}
          </>
        )}
      </section>

      {/* Soft, non-blocking save error */}
      {saveError && appView === "GAME" && gameState === "PLAYING" && (
        <p className="absolute bottom-3 left-0 right-0 z-30 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
          offline mode — progress not saved
        </p>
      )}
    </main>
  );
}

/* ================================================================== */
/* WELCOME                                                           */
/* ================================================================== */

function WelcomeView({
  name,
  onNameChange,
  onBegin,
  record,
  onRanking,
}: {
  name: string;
  onNameChange: (v: string) => void;
  onBegin: () => void;
  record: number;
  onRanking: () => void;
}) {
  const canBegin = name.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onBegin();
      }}
      className="animate-fade-up flex flex-col items-center gap-10 text-center"
    >
      {/* Title block */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.5em] text-[#00FF00]">
          <Skull className="h-4 w-4" />
          death by ai
        </div>
        <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-neutral-50 sm:text-7xl">
          Armaged<span className="text-[#00FF00]">.online</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
          Ten levels of Armageddon, each one built to kill you. Type a survival
          plan in {MAX_PLAN} characters or less and let the AI Judge decide
          whether you live or die.
        </p>
      </div>

      {/* Name entry */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <label
          htmlFor="player-name"
          className="text-[11px] uppercase tracking-[0.35em] text-neutral-400"
        >
          Enter your name, survivor
        </label>
        <input
          id="player-name"
          value={name}
          maxLength={24}
          autoFocus
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="anonymous"
          className="border border-[#00FF00]/30 bg-transparent px-4 py-3 text-center font-mono text-base text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-[#00FF00]/70"
        />
        <button
          type="submit"
          disabled={!canBegin}
          className="group mt-1 flex items-center justify-center gap-3 border-2 border-[#00FF00] bg-[#00FF00]/[0.06] px-6 py-4 font-mono text-sm uppercase tracking-[0.25em] text-[#00FF00] transition-all duration-150 hover:bg-[#00FF00]/20 hover:shadow-glow active:bg-[#00FF00]/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#00FF00]/[0.06] disabled:hover:shadow-none"
        >
          <Play className="h-4 w-4" />
          Begin
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        {record > 0 && (
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-600">
            your record · level {record} / {MAX_LEVEL}
          </p>
        )}
        <button
          type="button"
          onClick={onRanking}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-neutral-500 transition-colors hover:text-[#00FF00]"
        >
          <Trophy className="h-3.5 w-3.5" />
          View ranking
        </button>
      </div>
    </form>
  );
}

/* ================================================================== */
/* PLAYING                                                            */
/* ================================================================== */

function PlayingView({
  level,
  scenario,
  plan,
  onPlanChange,
  onSubmit,
  error,
}: {
  level: number;
  scenario: Scenario;
  plan: string;
  onPlanChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const remaining = plan.trim().length === 0;

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      {/* Level indicator + progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[#00FF00]">
          <span>
            Level {level} / {MAX_LEVEL}
          </span>
          <span className="text-neutral-500">{LEVEL_THEMES[level]}</span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-[#00FF00]/10">
          <div
            className="h-full bg-[#00FF00] shadow-glow transition-all duration-500"
            style={{ width: `${(level / MAX_LEVEL) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario card */}
      <article className="border border-[#00FF00]/40 bg-[#121212]/80 p-6 shadow-glow backdrop-blur-md sm:p-8">
        <h1 className="text-3xl font-bold leading-tight text-neutral-50 sm:text-4xl">
          {scenario.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-300 sm:text-lg">
          {scenario.description}
        </p>
      </article>

      {/* Plan input */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="plan"
          className="text-[11px] uppercase tracking-[0.35em] text-neutral-400"
        >
          Your survival plan
        </label>
        <textarea
          id="plan"
          value={plan}
          maxLength={MAX_PLAN}
          onChange={(e) => onPlanChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
          }}
          rows={3}
          autoFocus
          placeholder="Describe exactly what you do to survive…"
          className="resize-none border border-[#00FF00]/30 bg-transparent px-4 py-3 font-mono text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-[#00FF00]/70"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-600">
            ⌘/Ctrl + Enter to submit
          </span>
          <span
            className={`font-mono text-xs ${
              plan.length >= MAX_PLAN ? "text-red-400" : "text-neutral-500"
            }`}
          >
            {plan.length} / {MAX_PLAN}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 border border-red-500/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={remaining}
        className="group flex items-center justify-center gap-3 border-2 border-[#00FF00] bg-[#00FF00]/[0.06] px-6 py-4 font-mono text-sm uppercase tracking-[0.25em] text-[#00FF00] transition-all duration-150 hover:bg-[#00FF00]/20 hover:shadow-glow active:bg-[#00FF00]/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#00FF00]/[0.06] disabled:hover:shadow-none"
      >
        <Swords className="h-4 w-4" />
        Submit Plan
        <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
      </button>
    </div>
  );
}

/* ================================================================== */
/* JUDGING                                                            */
/* ================================================================== */

function JudgingView() {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-[#00FF00]" />
      <div className="flex flex-col gap-2">
        <p className="text-lg font-bold uppercase tracking-[0.3em] text-neutral-100">
          The AI is judging your fate
        </p>
        <p className="animate-pulse text-xs uppercase tracking-[0.3em] text-neutral-500">
          weighing logic · physics · sheer audacity
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* RESULT                                                             */
/* ================================================================== */

function ResultView({
  survived,
  level,
  narrative,
  onNext,
  onRestart,
}: {
  survived: boolean;
  level: number;
  narrative: string;
  onNext: () => void;
  onRestart: () => void;
}) {
  const hasNext = survived && level < MAX_LEVEL;
  const beatTheGame = survived && level >= MAX_LEVEL;

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      {/* Verdict stamp */}
      <div
        className={`animate-stamp inline-flex items-center gap-3 border-4 px-6 py-3 ${
          survived
            ? "border-[#00FF00] text-[#00FF00] shadow-glow"
            : "border-red-500 text-red-500"
        }`}
      >
        {survived ? (
          <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10" />
        ) : (
          <Skull className="h-8 w-8 sm:h-10 sm:w-10" />
        )}
        <span className="text-4xl font-black uppercase tracking-[0.2em] sm:text-5xl">
          {survived ? "Survived" : "Perished"}
        </span>
      </div>

      {/* Narrative */}
      <p className="animate-fade-up max-w-xl text-base leading-relaxed text-neutral-200 sm:text-lg">
        {narrative}
      </p>

      {beatTheGame && (
        <p className="animate-fade-up text-sm uppercase tracking-[0.35em] text-[#00FF00]">
          You outlasted the end of the universe. Legendary.
        </p>
      )}

      {/* Actions */}
      <div className="animate-fade-up flex w-full max-w-sm flex-col gap-3">
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="group flex items-center justify-center gap-3 border-2 border-[#00FF00] bg-[#00FF00]/[0.06] px-6 py-4 font-mono text-sm uppercase tracking-[0.25em] text-[#00FF00] transition-all duration-150 hover:bg-[#00FF00]/20 hover:shadow-glow active:bg-[#00FF00]/30"
          >
            Next Level
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
          </button>
        )}

        {(!survived || beatTheGame) && (
          <button
            type="button"
            onClick={onRestart}
            className={`group flex items-center justify-center gap-3 border-2 px-6 py-4 font-mono text-sm uppercase tracking-[0.25em] transition-all duration-150 ${
              survived
                ? "border-[#00FF00] bg-[#00FF00]/[0.06] text-[#00FF00] hover:bg-[#00FF00]/20 hover:shadow-glow"
                : "border-red-500 bg-red-500/[0.06] text-red-400 hover:bg-red-500/20"
            }`}
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Header tab                                                         */
/* ================================================================== */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] transition-colors sm:px-3 ${
        active
          ? "border-[#00FF00]/50 bg-[#00FF00]/10 text-[#00FF00]"
          : "border-transparent text-neutral-500 hover:text-[#00FF00]/80"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ================================================================== */
/* RANKING                                                           */
/* ================================================================== */

function rankColor(index: number): string {
  if (index === 0) return "#FFD700"; // gold
  if (index === 1) return "#C0C0C0"; // silver
  if (index === 2) return "#CD7F32"; // bronze
  return "#737373"; // neutral-500
}

function LeaderboardView({
  currentName,
  onPlay,
}: {
  currentName: string;
  onPlay: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setErrorMsg(null);
    fetchLeaderboard()
      .then((rows) => {
        if (!active) return;
        setEntries(rows);
        setStatus("ready");
      })
      .catch((e) => {
        if (!active) return;
        setErrorMsg(e instanceof Error ? e.message : "Failed to load ranking");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const me = currentName.trim().toLowerCase();

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3 text-[#00FF00]">
          <Trophy className="h-6 w-6" />
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] sm:text-3xl">
            Ranking
          </h1>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          highest level reached
        </span>
      </div>

      <div className="border border-[#00FF00]/40 bg-[#121212]/80 shadow-glow backdrop-blur-md">
        {status === "loading" && (
          <div className="flex items-center justify-center gap-3 px-5 py-12 text-xs uppercase tracking-[0.3em] text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#00FF00]" />
            loading survivors…
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="max-w-sm text-xs leading-relaxed text-neutral-400">
              Ranking unavailable. Make sure the database is connected and the
              schema (including the <span className="text-[#00FF00]">leaderboard</span>{" "}
              view) has been applied.
            </p>
            <p className="break-words text-[10px] text-neutral-600">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="border border-[#00FF00]/40 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#00FF00] transition-colors hover:bg-[#00FF00]/10"
            >
              Retry
            </button>
          </div>
        )}

        {status === "ready" && entries.length === 0 && (
          <p className="px-5 py-12 text-center text-xs uppercase tracking-[0.3em] text-neutral-500">
            no survivors ranked yet — be the first
          </p>
        )}

        {status === "ready" && entries.length > 0 && (
          <ul className="max-h-[58vh] divide-y divide-[#00FF00]/10 overflow-y-auto">
            {entries.map((e, i) => {
              const isMe = !!me && e.username.trim().toLowerCase() === me;
              return (
                <li
                  key={`${e.username}-${i}`}
                  className={`flex items-center gap-4 px-5 py-3 ${
                    isMe ? "bg-[#00FF00]/10" : ""
                  }`}
                >
                  <span
                    className="w-7 shrink-0 text-right font-mono text-sm font-bold"
                    style={{ color: rankColor(i) }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-mono text-sm text-neutral-100">
                    {e.username}
                    {isMe && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-[#00FF00]">
                        you
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-[#00FF00]">
                    lvl {e.max_level_reached}
                    <span className="text-neutral-600"> / {MAX_LEVEL}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onPlay}
        className="group flex items-center justify-center gap-3 self-start border border-[#00FF00]/40 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.25em] text-[#00FF00] transition-colors hover:bg-[#00FF00]/10"
      >
        <Gamepad2 className="h-4 w-4" />
        Back to game
      </button>
    </div>
  );
}
