"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Gamepad2,
  Loader2,
  Play,
  RotateCcw,
  Skull,
  ShieldCheck,
  Swords,
  Radiation,
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
const LEVEL_SECONDS = 90; // countdown per level; auto-submits at zero

/**
 * Background track per level group: 1-3, 4-6, 7-9, and 10 on its own. The
 * track only changes when the player crosses a group boundary, so moving
 * within a group (e.g. 1→2) keeps the same loop playing.
 */
function bgTrackForLevel(level: number): string {
  if (level >= 10) return "/bg-level-10.mp3";
  if (level >= 7) return "/bg-level-7-9.mp3";
  if (level >= 4) return "/bg-level-4-6.mp3";
  return "/bg-level-1-3.mp3";
}

/** Per-level background image, one per level (1-indexed, clamped to range). */
function bgImageForLevel(level: number): string {
  const n = Math.min(Math.max(level, 1), MAX_LEVEL);
  return `/bg-level-${n}.jpg`;
}

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

/** A unique-enough default handle like "Guest47193" so the name is never empty. */
function generateGuestName(): string {
  return `Guest${Math.floor(10000 + Math.random() * 90000)}`;
}

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
  const [timeLeft, setTimeLeft] = useState(LEVEL_SECONDS);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Background music (ambiance) ----------------------------------------
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  // Landing-screen ambiance: late-night jazz + a panicking crowd, layered.
  const landingJazzRef = useRef<HTMLAudioElement | null>(null);
  const landingCrowdRef = useRef<HTMLAudioElement | null>(null);
  // Flips true on the first user gesture (browser autoplay policy); state so
  // the playback effects re-run once audio is unlocked.
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [bgMuted, setBgMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Death sound effect: negative beeps, then a "game over" voice.
  const deathBeepsRef = useRef<HTMLAudioElement | null>(null);
  const gameOverRef = useRef<HTMLAudioElement | null>(null);
  // Win sound effect: a "level completed" chime.
  const levelCompleteRef = useRef<HTMLAudioElement | null>(null);

  /* ----------------------------------------------------------------
   * Pick a random opening scenario — client-only, after hydration, so the
   * Math.random() pick never differs from the server-rendered HTML.
   * Also pre-fill the name from a previous visit (localStorage is
   * client-only, so reading it here avoids any hydration mismatch).
   * ---------------------------------------------------------------- */
  useEffect(() => {
    setCurrentScenario(randomScenario(1));
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(NAME_STORAGE_KEY);
    } catch {
      /* localStorage blocked — fall through to a fresh guest name */
    }
    // Always land on a non-empty name so the Begin button is never disabled.
    setPlayerName(saved || generateGuestName());
  }, []);

  /* ----------------------------------------------------------------
   * Begin: lock in the player's name and drop them into level 1.
   * ---------------------------------------------------------------- */
  function beginGame() {
    // If the player cleared the field, fall back to a fresh guest name rather
    // than blocking — the Begin button is never disabled.
    const name = playerName.trim() || generateGuestName();
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

    const scenarioPrompt = `${currentScenario.title}: ${currentScenario.description}`;

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioPrompt,
          userPlan: trimmed.slice(0, MAX_PLAN),
          level: currentLevel,
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
   * Time's up. An empty plan is an instant death (no AI call); anything
   * the player has typed gets sent to the Judge, which decides whether
   * it's a real plan or nonsense.
   * ---------------------------------------------------------------- */
  function handleTimeUp() {
    if (gameState !== "PLAYING") return;
    if (plan.trim()) {
      void submitPlan();
      return;
    }
    // Froze — empty plan. Perish without bothering the Judge.
    setGameState("RESULT");
    setResult({
      outcome: "PERISHED",
      narrative:
        "The clock ran out and you just stood there, plan unwritten and mind blank. The disaster did not wait for you to think of something clever.",
      image_prompt: `A person frozen in panic, out of time, as ${currentScenario.title} destroys everything around them, cinematic and bleak`,
    });
    void recordRun({
      level: currentLevel,
      scenarioTitle: currentScenario.title,
      userPlan: "",
      outcome: "PERISHED",
    });
  }

  // Which track should be playing. A death (game over) switches to the
  // game-over music until the player starts a new run; otherwise the music
  // follows the level group. Surviving level 10 is a win, not a game over.
  const isGameOver = gameState === "RESULT" && result?.outcome === "PERISHED";
  const bgTrack = isGameOver
    ? "/bg-game-over.mp3"
    : bgTrackForLevel(currentLevel);
  // On a win the background music stops — the level-complete chime is enough.
  const isWin = gameState === "RESULT" && result?.outcome === "SURVIVED";
  // The landing/lobby screen has its own layered ambiance instead of a track.
  const isLanding = gameState === "WELCOME";
  // Background image: a dedicated landing image on the welcome screen, then a
  // different image per level once the game is underway.
  const bgImage = isLanding ? "/bg-landing.jpg" : bgImageForLevel(currentLevel);

  /* ----------------------------------------------------------------
   * Unlock audio on the first user gesture (browser autoplay policy). We also
   * start the landing ambiance *synchronously here*, inside the gesture's call
   * stack — stricter browsers reject a play() that happens later in an effect,
   * which would leave the lobby silent until a second interaction. Listening
   * on pointerdown/keydown (rather than click) starts it at the earliest
   * allowed instant. The effects below take over for everything after.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    function start() {
      setAudioUnlocked(true);
      landingJazzRef.current?.play().catch(() => {});
      landingCrowdRef.current?.play().catch(() => {});
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
    }
    document.addEventListener("pointerdown", start, { once: true });
    document.addEventListener("keydown", start, { once: true });
    return () => {
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
    };
  }, []);

  /* ----------------------------------------------------------------
   * Main background track. src is managed here (not a JSX attribute) so
   * switching level groups reliably reloads the loop. It plays once audio is
   * unlocked, except on the landing screen (which has its own ambiance) and
   * on a win (where the level-complete chime stands alone).
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const music = bgMusicRef.current;
    if (!music) return;
    if (!music.src.endsWith(bgTrack)) {
      music.src = bgTrack;
      music.load();
    }
    if (audioUnlocked && !isLanding && !isWin) {
      music.play().catch(() => {
        /* blocked — ignore */
      });
    } else {
      music.pause();
    }
  }, [bgTrack, isLanding, isWin, audioUnlocked]);

  /* ----------------------------------------------------------------
   * Landing/lobby ambiance: jazz + panicking crowd, layered, looping. Plays
   * only on the welcome screen; paused everywhere else.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const jazz = landingJazzRef.current;
    const crowd = landingCrowdRef.current;
    if (!jazz || !crowd) return;
    if (audioUnlocked && isLanding) {
      jazz.play().catch(() => {});
      crowd.play().catch(() => {});
    } else {
      jazz.pause();
      crowd.pause();
    }
  }, [isLanding, audioUnlocked]);

  /* Keep every audio element's level in sync with the volume control. The
   * crowd panic sits lower so it stays a backdrop under the jazz. */
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = bgVolume;
      bgMusicRef.current.muted = bgMuted;
    }
    if (landingJazzRef.current) {
      landingJazzRef.current.volume = bgVolume;
      landingJazzRef.current.muted = bgMuted;
    }
    if (landingCrowdRef.current) {
      landingCrowdRef.current.volume = Math.min(1, bgVolume * 0.6);
      landingCrowdRef.current.muted = bgMuted;
    }
  }, [bgVolume, bgMuted]);

  /* ----------------------------------------------------------------
   * Per-level countdown. Reset to 90s whenever a fresh scenario is shown,
   * tick down only while actively playing the game (paused on the ranking
   * tab), and fire handleTimeUp() at zero.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (gameState === "PLAYING") setTimeLeft(LEVEL_SECONDS);
  }, [currentScenario, gameState]);

  useEffect(() => {
    if (appView !== "GAME" || gameState !== "PLAYING") return;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [appView, gameState]);

  /* ----------------------------------------------------------------
   * Death sound: on a PERISHED verdict, play the negative beeps, then
   * the "game over" voice once the beeps finish. Honors the mute/volume
   * control; SFX sit a bit above the ambient music level. Fires once per
   * death (the `result` object is new each round) and is cleaned up when
   * the player moves on.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (gameState !== "RESULT" || result?.outcome !== "PERISHED") return;
    if (bgMuted || bgVolume === 0) return;
    const beeps = deathBeepsRef.current;
    const over = gameOverRef.current;
    if (!beeps || !over) return;

    const vol = Math.min(1, bgVolume + 0.5);
    beeps.volume = vol;
    over.volume = vol;

    const playOver = () => {
      over.currentTime = 0;
      over.play().catch(() => {});
    };
    beeps.addEventListener("ended", playOver, { once: true });

    over.pause();
    beeps.currentTime = 0;
    beeps.play().catch(() => {});

    return () => {
      beeps.removeEventListener("ended", playOver);
      beeps.pause();
      over.pause();
    };
    // Read the latest mute/volume at death time only; don't replay if the
    // player nudges the slider while the verdict is on screen.
  }, [result, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ----------------------------------------------------------------
   * Win sound: on a SURVIVED verdict, play the "level completed" chime.
   * Same mute/volume rules as the death SFX; fires once per win.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (gameState !== "RESULT" || result?.outcome !== "SURVIVED") return;
    if (bgMuted || bgVolume === 0) return;
    const chime = levelCompleteRef.current;
    if (!chime) return;

    chime.volume = Math.min(1, bgVolume + 0.5);
    chime.currentTime = 0;
    chime.play().catch(() => {});

    return () => {
      chime.pause();
    };
  }, [result, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  const survived = result?.outcome === "SURVIVED";
  const showResult = gameState === "RESULT" && result;
  // Only paint the verdict background while actually viewing the game.
  const showVerdictBg = appView === "GAME" && !!showResult;

  return (
    <main className="relative min-h-dvh w-full bg-[#121212] text-neutral-200">
      {/* Background layers — fixed so they keep covering the viewport while the
          content scrolls (e.g. when the mobile keyboard is open). */}
      <div aria-hidden className="fixed inset-0 z-0 bg-[#121212]">
        {/* Faint ambient base — a different image per level */}
        <img
          src={bgImage}
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
                ? "bg-gradient-to-b from-[#f5a524]/10 via-black/60 to-black/90"
                : "bg-gradient-to-b from-red-700/15 via-black/65 to-black/95"
              : "bg-gradient-to-b from-black/40 via-black/30 to-black/80"
          }`}
        />
      </div>

      <div className="scanlines pointer-events-none fixed inset-0 z-10" />

      {/* Background music — src is set per level group in an effect. */}
      <audio ref={bgMusicRef} loop className="hidden" preload="auto" />
      {/* Landing ambiance: jazz + panicking crowd, layered and looping. */}
      <audio ref={landingJazzRef} src="/landing-jazz.mp3" loop className="hidden" preload="auto" />
      <audio ref={landingCrowdRef} src="/landing-crowd.mp3" loop className="hidden" preload="auto" />
      {/* Death SFX: beeps play first, then the game-over voice. */}
      <audio ref={deathBeepsRef} src="/death-beeps.mp3" className="hidden" preload="auto" />
      <audio ref={gameOverRef} src="/game-over.mp3" className="hidden" preload="auto" />
      {/* Win SFX: level-completed chime. */}
      <audio ref={levelCompleteRef} src="/level-complete.mp3" className="hidden" preload="auto" />

      {/* Header ----------------------------------------------------------- */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-12 items-center justify-between border-b border-[#c2410c]/40 bg-[#121212]/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2 text-[#f5a524]">
          <Radiation className="h-4 w-4" />
          <span className="font-display text-base font-bold uppercase tracking-[0.2em]">
            Armaged.online
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-neutral-500 md:inline">
            // survive or perish
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
            <span className="text-[#f5a524]/70">· {playerName}</span>
          )}
          {maxLevelReached > 0 && (
            <span className="text-[#f5a524]/70">record · lvl {maxLevelReached}</span>
          )}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVolume((v) => !v)}
              className="text-[#f5a524]/60 transition-colors hover:text-[#f5a524]"
              aria-label="Toggle volume control"
            >
              {bgMuted || bgVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            {showVolume && (
              <div className="absolute right-0 top-7 flex items-center gap-3 border border-[#f5a524]/30 bg-[#121212]/95 px-3 py-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setBgMuted((m) => !m)}
                  className="text-[10px] uppercase tracking-widest text-[#f5a524]/60 hover:text-[#f5a524]"
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
                  className="h-1 w-24 cursor-pointer accent-[#f5a524]"
                />
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Hazard tape under the header — industrial accent. */}
      <div
        aria-hidden
        className="hazard-stripes pointer-events-none fixed left-0 right-0 top-12 z-40 h-[3px] opacity-50"
      />

      {/* Center stage — own the vertical centering here (not on <main>) so the
          content can grow taller than the viewport and scroll when the mobile
          keyboard is open, instead of being clipped behind it. pt-16 clears the
          fixed header. */}
      <section className="relative z-20 mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-5 pb-16 pt-16 sm:px-6">
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
                timeLeft={timeLeft}
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
        <p className="fixed bottom-3 left-0 right-0 z-30 text-center text-[10px] uppercase tracking-[0.2em] text-neutral-600">
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
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.5em] text-[#f5a524]">
          <AlertTriangle className="h-4 w-4" />
          survival protocol
        </div>
        <h1 className="font-display text-[clamp(1.75rem,9vw,6rem)] font-black uppercase leading-[0.85] tracking-tight text-neutral-50">
          Armaged<span className="text-[#f5a524]">.online</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
          Ten deadly levels. Write your survival plan — the AI Judge decides if
          you live or die.
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
          placeholder="Guest12345"
          className="border border-[#c2410c]/40 bg-[#1b1916]/70 px-4 py-3 text-center font-mono text-base text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-[#f5a524]"
        />
        <button
          type="submit"
          className="notch group mt-1 flex items-center justify-center gap-3 border border-[#f5a524]/60 bg-gradient-to-b from-[#c2410c] to-[#9a3412] px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#f7e9d0] shadow-glow transition-all duration-150 hover:from-[#f5a524] hover:to-[#c2410c] hover:text-[#121212] active:translate-y-px"
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
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-neutral-500 transition-colors hover:text-[#f5a524]"
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
  timeLeft,
}: {
  level: number;
  scenario: Scenario;
  plan: string;
  onPlanChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  timeLeft: number;
}) {
  const remaining = plan.trim().length === 0;

  const urgent = timeLeft <= 10;
  const warning = timeLeft > 10 && timeLeft <= 30;
  const timeColor = urgent
    ? "text-red-500"
    : warning
    ? "text-amber-400"
    : "text-[#f5a524]";
  const barColor = urgent ? "bg-red-500" : warning ? "bg-amber-400" : "bg-[#f5a524]";
  const mm = Math.floor(timeLeft / 60);
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="animate-fade-up flex flex-col gap-6">
      {/* Level indicator + countdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em]">
          <span className="font-display text-sm font-bold uppercase tracking-[0.25em] text-[#f5a524]">
            Level {level} / {MAX_LEVEL}
          </span>
          <span className="hidden text-neutral-500 sm:inline">
            {LEVEL_THEMES[level]}
          </span>
          <span
            className={`flex items-center gap-1.5 font-mono tabular-nums ${timeColor} ${
              urgent ? "animate-pulse" : ""
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {mm}:{ss}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden border border-[#c2410c]/30 bg-[#1b1916]">
          <div
            className={`h-full ${barColor} transition-[width] duration-1000 ease-linear`}
            style={{ width: `${(timeLeft / LEVEL_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario card — concrete panel with a hazard edge */}
      <article className="border border-l-4 border-[#c2410c]/50 border-l-[#f5a524] bg-[#15130f]/85 p-6 shadow-glow backdrop-blur-md sm:p-8">
        <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-wide text-neutral-50 sm:text-4xl">
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
        {/* text-base (16px) on mobile stops iOS Safari auto-zooming on focus,
            which would otherwise shift the layout and re-cover the input. */}
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
          className="resize-none border border-[#c2410c]/40 bg-[#1b1916]/70 px-4 py-3 font-mono text-base text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-[#f5a524] sm:text-sm"
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
        className="notch group flex items-center justify-center gap-3 border border-[#f5a524]/60 bg-gradient-to-b from-[#c2410c] to-[#9a3412] px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#f7e9d0] shadow-glow transition-all duration-150 hover:from-[#f5a524] hover:to-[#c2410c] hover:text-[#121212] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:from-[#c2410c] disabled:hover:to-[#9a3412] disabled:hover:text-[#f7e9d0]"
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
      <Loader2 className="h-12 w-12 animate-spin text-[#f5a524]" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-xl font-bold uppercase tracking-[0.3em] text-neutral-100">
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
            ? "border-[#f5a524] text-[#f5a524] shadow-glow"
            : "border-red-500 text-red-500"
        }`}
      >
        {survived ? (
          <ShieldCheck className="h-8 w-8 sm:h-10 sm:w-10" />
        ) : (
          <Skull className="h-8 w-8 sm:h-10 sm:w-10" />
        )}
        <span className="font-display text-5xl font-black uppercase tracking-[0.2em] sm:text-6xl">
          {survived ? "Survived" : "Perished"}
        </span>
      </div>

      {/* Narrative */}
      <p className="animate-fade-up max-w-xl text-base leading-relaxed text-neutral-200 sm:text-lg">
        {narrative}
      </p>

      {beatTheGame && (
        <p className="animate-fade-up text-sm uppercase tracking-[0.35em] text-[#f5a524]">
          You outlasted the end of the universe. Legendary.
        </p>
      )}

      {/* Actions */}
      <div className="animate-fade-up flex w-full max-w-sm flex-col gap-3">
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="notch group flex items-center justify-center gap-3 border border-[#f5a524]/60 bg-gradient-to-b from-[#c2410c] to-[#9a3412] px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#f7e9d0] shadow-glow transition-all duration-150 hover:from-[#f5a524] hover:to-[#c2410c] hover:text-[#121212] active:translate-y-px"
          >
            Next Level
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
          </button>
        )}

        {(!survived || beatTheGame) && (
          <button
            type="button"
            onClick={onRestart}
            className={`notch group flex items-center justify-center gap-3 px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] transition-all duration-150 active:translate-y-px ${
              survived
                ? "border border-[#f5a524]/60 bg-gradient-to-b from-[#c2410c] to-[#9a3412] text-[#f7e9d0] shadow-glow hover:from-[#f5a524] hover:to-[#c2410c] hover:text-[#121212]"
                : "border border-red-500/70 bg-gradient-to-b from-red-700 to-red-900 text-red-50 hover:from-red-600 hover:to-red-800"
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
          ? "border-[#f5a524]/50 bg-[#f5a524]/10 text-[#f5a524]"
          : "border-transparent text-neutral-500 hover:text-[#f5a524]/80"
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
        <div className="flex items-center gap-3 text-[#f5a524]">
          <Trophy className="h-6 w-6" />
          <h1 className="font-display text-3xl font-black uppercase tracking-[0.2em] sm:text-4xl">
            Ranking
          </h1>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          highest level reached
        </span>
      </div>

      <div className="border border-l-4 border-[#c2410c]/50 border-l-[#f5a524] bg-[#15130f]/85 shadow-glow backdrop-blur-md">
        {status === "loading" && (
          <div className="flex items-center justify-center gap-3 px-5 py-12 text-xs uppercase tracking-[0.3em] text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#f5a524]" />
            loading survivors…
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="max-w-sm text-xs leading-relaxed text-neutral-400">
              Ranking unavailable. Make sure the database is connected and the
              schema (including the <span className="text-[#f5a524]">leaderboard</span>{" "}
              view) has been applied.
            </p>
            <p className="break-words text-[10px] text-neutral-600">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="border border-[#f5a524]/40 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#f5a524] transition-colors hover:bg-[#f5a524]/10"
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
          <ul className="max-h-[58vh] divide-y divide-[#f5a524]/10 overflow-y-auto">
            {entries.map((e, i) => {
              const isMe = !!me && e.username.trim().toLowerCase() === me;
              return (
                <li
                  key={`${e.username}-${i}`}
                  className={`flex items-center gap-4 px-5 py-3 ${
                    isMe ? "bg-[#f5a524]/10" : ""
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
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-[#f5a524]">
                        you
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-[#f5a524]">
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
        className="group flex items-center justify-center gap-3 self-start border border-[#c2410c]/60 bg-[#1b1916]/60 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#f5a524] transition-colors hover:bg-[#c2410c]/20"
      >
        <Gamepad2 className="h-4 w-4" />
        Back to game
      </button>
    </div>
  );
}
