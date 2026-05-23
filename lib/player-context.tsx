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

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    async function init() {
      try {
        // Reuse an existing session if persisted in localStorage.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let activeUser: User | null = session?.user ?? null;

        // No session yet → spin up a fresh anonymous user.
        if (!activeUser) {
          const { data, error: signInErr } = await supabase.auth.signInAnonymously();
          if (signInErr) throw signInErr;
          activeUser = data.user;
        }

        if (!mounted || !activeUser) return;
        setUser(activeUser);
        await loadPlayerData(activeUser.id);
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : "Failed to initialize session";
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadPlayerData]);

  return (
    <PlayerContext.Provider
      value={{ user, player, artifacts, loading, error, refresh, addArtifact }}
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
