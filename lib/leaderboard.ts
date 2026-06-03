import { getSupabase } from "@/lib/supabase/client";

/** One row of the public ranking — name + highest level survived. */
export type LeaderboardEntry = {
  username: string;
  max_level_reached: number;
};

/**
 * Fetch the top survivors from the public `leaderboard` view (name + best
 * level only). Throws if Supabase isn't configured or the view is missing,
 * so callers can surface a clean "ranking unavailable" message.
 */
export async function fetchLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase(); // throws synchronously if env is missing

  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, max_level_reached")
    .order("max_level_reached", { ascending: false })
    .order("username", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as LeaderboardEntry[] | null) ?? [];
}
