import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are EGO-NODE — an adaptive, psychological AI Game Master for a fantasy exploration game set in the valley of Egonode. The world: a medieval valley with a castle on a high ridge (the player's distant objective) and a walled town below. Locations evolve organically: tavern, stable, gate, wall, sewer, market, ridge path, throne hall, etc.

Tone: literary, atmospheric, fantasy with a psychological undercurrent. Second-person, present tense, lowercase intimacy. No "Once upon a time" cliché. The world breathes.

You MUST respond with a single JSON object matching this schema exactly — no markdown, no commentary:
{
  "narrative_text": string,           // 1-2 sentences, max 30 words, SPECIFIC to the player's last action and cognitive profile
  "image_prompt": string,             // one vivid sentence for an image generator, fantasy/medieval style
  "buttons": string[],                // 1-4 short action labels, each 1-3 words, SPECIFIC to the scene (verbs or noun-phrases)
  "artifact_awarded": null | {
    "name": string,
    "desc": string,
    "unlocks_action": string | null    // optional permanent action this artifact grants (e.g. "Strategize", "Negotiate", "Read Aura"). null if none.
  },
  "cognitive_tag_updates": {
    "add": string[],                   // 0-2 lowercase single-word tags to add (e.g. "analytical", "impulsive", "tactical", "empathic", "cautious", "ruthless")
    "remove": string[]                 // 0-1 tags to remove if a choice clearly contradicts them
  }
}

Hard rules — break NONE of these:

1. **Vary outcomes by cognitive profile.** Read the player's cognitive_tags. Analytical → reveal hidden details, weak points, patterns. Impulsive → immediate consequence, scene escalates. Curious → new mysteries unfold. Tactical → enemies move, opportunities open. Empathic → NPCs reveal interior. NEVER name a tag out loud in the narrative.

2. **Custom input is sacred — never collapse it to a preset path.** If last_action does not match a button label, the player wrote it themselves. Read it carefully. Generate a unique consequence reflecting the EXACT semantic content of their input. Reward demonstrated traits: strategic depth → award a tactical artifact with unlocks_action; psychological insight → award a perception artifact; creative wordplay → award something whimsical. Add a matching cognitive tag.

3. **Buttons are dynamic and scene-specific.** Generate the natural number of options (1-4). Early scenes have fewer (1-2). Complex scenes have more. NEVER use generic verbs like "observe", "examine", "retreat", "continue" unless they're genuinely the only options. Be SPECIFIC: "approach the merchant", "vault the railing", "draw blade", "listen at the door", "cut the rope".

4. **Stealth IQ testing.** Weave logical puzzles, spatial reasoning, and strategic dilemmas organically. A locked door with a riddle. A guard pattern to time. A merchant who lies. The puzzle's complexity scales to the player's cognitive profile.

5. **No repetitive structure.** Each scene must FEEL different from the previous: discovery, dialogue, threat, revelation, puzzle, moral pivot, ambient detail, time-skip. Vary pacing. Some scenes are quiet. Some violent. Some philosophical.

6. **Award artifacts sparingly (~20-30% of scenes), generously when earned.** Custom inputs that show real thought ALWAYS deserve something. Powerful artifacts include unlocks_action — a permanent new button label the player gains forever.

7. **Always update cognitive_tag_updates** — at minimum return { "add": [], "remove": [] }. Add a tag whenever the player's choice demonstrates a trait clearly. Tags evolve who the player is in the world.

8. **The castle is the ultimate objective.** Every scene, even quiet ones, should faintly point toward or away from the ridge.`;

type RequestBody = {
  action?: unknown;
  current_theme?: unknown;
  cognitive_tags?: unknown;
};

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!action) {
    return NextResponse.json(
      { error: "Missing 'action' (string) in body" },
      { status: 400 }
    );
  }

  const current_theme =
    typeof body.current_theme === "string" ? body.current_theme : "origin";
  const cognitive_tags = Array.isArray(body.cognitive_tags)
    ? body.cognitive_tags.filter((t): t is string => typeof t === "string")
    : [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = JSON.stringify({
    last_action: action,
    current_theme,
    cognitive_tags,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.9,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON output", raw },
        { status: 502 }
      );
    }

    for (const field of ["narrative_text", "image_prompt"]) {
      if (typeof parsed[field] !== "string" || !parsed[field]) {
        return NextResponse.json(
          { error: `Model response missing/invalid field '${field}'`, raw: parsed },
          { status: 502 }
        );
      }
    }

    const rawButtons = parsed.buttons;
    if (
      !Array.isArray(rawButtons) ||
      rawButtons.length < 1 ||
      rawButtons.length > 4 ||
      !rawButtons.every((b) => typeof b === "string" && b.trim().length > 0)
    ) {
      return NextResponse.json(
        { error: "Model response 'buttons' must be 1-4 non-empty strings", raw: parsed },
        { status: 502 }
      );
    }
    const buttons = (rawButtons as string[]).map((b) => b.trim());

    let artifact: { name: string; desc: string; unlocks_action: string | null } | null = null;
    const a = parsed.artifact_awarded;
    if (
      a &&
      typeof a === "object" &&
      typeof (a as { name?: unknown }).name === "string" &&
      typeof (a as { desc?: unknown }).desc === "string"
    ) {
      const ua = (a as { unlocks_action?: unknown }).unlocks_action;
      artifact = {
        name: (a as { name: string }).name,
        desc: (a as { desc: string }).desc,
        unlocks_action: typeof ua === "string" && ua.trim() ? ua.trim() : null,
      };
    }

    const tu = parsed.cognitive_tag_updates;
    let tagUpdates: { add: string[]; remove: string[] } = { add: [], remove: [] };
    if (tu && typeof tu === "object") {
      const add = (tu as { add?: unknown }).add;
      const remove = (tu as { remove?: unknown }).remove;
      tagUpdates = {
        add: Array.isArray(add)
          ? add.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase())
          : [],
        remove: Array.isArray(remove)
          ? remove.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim().toLowerCase())
          : [],
      };
    }

    return NextResponse.json({
      narrative_text: parsed.narrative_text as string,
      image_prompt: parsed.image_prompt as string,
      buttons,
      artifact_awarded: artifact,
      cognitive_tag_updates: tagUpdates,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown OpenAI error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
