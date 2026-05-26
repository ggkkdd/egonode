"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import type { Artifact, Player } from "@/lib/types";

type PlayerContextValue = {
  user: User | null;
  player: Player | null;
  artifacts: Artifact[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addArtifact: (
    name: string,
    description: string,
    isCuriosityKey?: boolean
  ) => Promise<Artifact | null>;
  updateCognitiveTags: (add: string[], remove: string[]) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayerData = useCallback(async (userId: string) => {
    const supabase = getSupabase();

    const [playerRes, artifactsRes] = await Promise.all([
      supabase.from("players").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("artifacts")
        .select("*")
        .eq("player_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (playerRes.error) throw playerRes.error;
    if (artifactsRes.error) throw artifactsRes.error;

    setPlayer(playerRes.data as Player | null);
    setArtifacts((artifactsRes.data as Artifact[] | null) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadPlayerData(user.id);
  }, [user, loadPlayerData]);

  const addArtifact = useCallback(
    async (name: string, description: string, isCuriosityKey = false) => {
      if (!user) return null;
      const supabase = getSupabase();
      const { data, error: insertErr } = await supabase
        .from("artifacts")
        .insert({
          player_id: user.id,
          name,
          description,
          is_curiosity_key: isCuriosityKey,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      const inserted = data as Artifact;
      setArtifacts((prev) => [...prev, inserted]);
      return inserted;
    },
    [user]
  );

  const updateCognitiveTags = useCallback(
    async (add: string[], remove: string[]) => {
      if (!user || !player) return;
      const next = Array.from(
        new Set([
          ...player.cognitive_tags.filter((t) => !remove.includes(t)),
          ...add,
        ])
      );
      if (
        next.length === player.cognitive_tags.length &&
        next.every((t) => player.cognitive_tags.includes(t))
      ) {
        return; // no change
      }
      const supabase = getSupabase();
      const { error: updErr } = await supabase
        .from("players")
        .update({ cognitive_tags: next })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setPlayer({ ...player, cognitive_tags: next });
    },
    [user, player]
  );

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      try {
        // getSupabase() can throw synchronously if env vars are missing —
        // keep it inside the try so the message reaches the sidebar banner
        // instead of triggering React's generic error overlay.
        const supabase = getSupabase();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        let activeUser: User | null = session?.user ?? null;

        if (!activeUser) {
          const { data, error: signInErr } = await supabase.auth.signInAnonymously();
          if (signInErr) throw signInErr;
          activeUser = data.user;
        }

        if (!mounted || !activeUser) return;
        setUser(activeUser);
        await loadPlayerData(activeUser.id);

        const { data: sub } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUser(session?.user ?? null);
          }
        );
        subscription = sub.subscription;
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : "Failed to initialize session";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [loadPlayerData]);

  return (
    <PlayerContext.Provider
      value={{ user, player, artifacts, loading, error, refresh, addArtifact, updateCognitiveTags }}
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
