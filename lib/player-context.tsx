"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import type { Player, RunLog } from "@/lib/types";

type PlayerContextValue = {
  /** Highest level the player has ever survived (0 if none / not connected). */
  maxLevelReached: number;
  /** True once Supabase is connected and a player row is loaded. */
  ready: boolean;
  /** Non-fatal Supabase message, surfaced as a small banner. Never blocks play. */
  error: string | null;
  /**
   * Persist one attempt: append to the `runs` log and, on a survival that beats
   * the player's record, bump `max_level_reached`. Fully best-effort — any
   * failure is swallowed so the game keeps running without a database.
   */
  recordRun: (run: RunLog) => Promise<void>;
  /** Save the player's chosen display name to `players.username`. Best-effort. */
  saveUsername: (name: string) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [maxLevelReached, setMaxLevelReached] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the live user id without forcing re-renders of consumers.
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      try {
        // getSupabase() throws synchronously if env vars are missing — keep it
        // inside the try so the message becomes a soft banner, not a crash.
        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        let activeUser: User | null = session?.user ?? null;
        if (!activeUser) {
          const { data, error: signInErr } =
            await supabase.auth.signInAnonymously();
          if (signInErr) throw signInErr;
          activeUser = data.user;
        }

        if (!mounted || !activeUser) return;
        userRef.current = activeUser;

        const { data: row, error: playerErr } = await supabase
          .from("players")
          .select("id, username, max_level_reached, created_at")
          .eq("id", activeUser.id)
          .maybeSingle();
        if (playerErr) throw playerErr;

        if (!mounted) return;
        if (row) {
          const p = row as Player;
          setPlayer(p);
          setMaxLevelReached(p.max_level_reached ?? 0);
        }
        setReady(true);

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
          userRef.current = s?.user ?? null;
        });
        subscription = sub.subscription;
      } catch (e) {
        if (!mounted) return;
        const msg =
          e instanceof Error ? e.message : "Could not connect to save data";
        // Persistence is optional — record the reason but let the game play on.
        setError(msg);
      }
    }

    init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const recordRun = useCallback(
    async (run: RunLog) => {
      const user = userRef.current;
      if (!user) return; // No Supabase / not signed in — skip silently.

      try {
        const supabase = getSupabase();

        const { error: insertErr } = await supabase.from("runs").insert({
          player_id: user.id,
          level: run.level,
          scenario_title: run.scenarioTitle,
          user_plan: run.userPlan,
          outcome: run.outcome,
        });
        if (insertErr) throw insertErr;

        if (run.outcome === "SURVIVED" && run.level > maxLevelReached) {
          const { error: updErr } = await supabase
            .from("players")
            .update({ max_level_reached: run.level })
            .eq("id", user.id);
          if (updErr) throw updErr;
          setMaxLevelReached(run.level);
          setPlayer((prev) =>
            prev ? { ...prev, max_level_reached: run.level } : prev
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save run";
        setError(msg);
      }
    },
    [maxLevelReached]
  );

  const saveUsername = useCallback(async (name: string) => {
    const user = userRef.current;
    const trimmed = name.trim();
    if (!user || !trimmed) return; // No Supabase / empty name — skip silently.

    try {
      const supabase = getSupabase();
      const { error: updErr } = await supabase
        .from("players")
        .update({ username: trimmed })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setPlayer((prev) => (prev ? { ...prev, username: trimmed } : prev));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save name";
      setError(msg);
    }
  }, []);

  return (
    <PlayerContext.Provider
      value={{ maxLevelReached, ready, error, recordRun, saveUsername }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}
