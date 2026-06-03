// =====================================================================
// Armaged.online — "Death by AI" survival game
// =====================================================================

/** A single Armageddon scenario the player must survive. */
export type Scenario = {
  level: number;
  title: string;
  description: string;
};

/** The AI Judge's verdict on a survival plan. */
export type Outcome = "SURVIVED" | "PERISHED";

/** Strict JSON shape returned by /api/judge. */
export type JudgeResult = {
  outcome: Outcome;
  /** A brutal, funny, or cinematic 2-sentence explanation of their fate. */
  narrative: string;
  /** Prompt for an image generator showing their success or death. */
  image_prompt: string;
};

/** Where the player is in the loop. */
export type GameState = "PLAYING" | "JUDGING" | "RESULT";

/** Persisted player profile (Supabase `players` row). */
export type Player = {
  id: string;
  username: string;
  max_level_reached: number;
  created_at: string;
};

/** One logged attempt, saved to the `runs` table for analytics. */
export type RunLog = {
  level: number;
  scenarioTitle: string;
  userPlan: string;
  outcome: Outcome;
};
