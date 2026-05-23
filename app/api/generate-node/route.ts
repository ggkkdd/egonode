import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORE_RULE =
  "You are an AI Game Master. The user is navigating a dynamic, psychological game. Base the scenario on their current_theme and cognitive_tags.";

const SYSTEM_PROMPT = `${CORE_RULE}

You MUST respond with a single JSON object matching this schema exactly — no markdown, no commentary:
{
  "narrative_text": string,   // 2-4 sentences, evocative second-person prose describing the scene that results from the user's action
  "image_prompt": string,     // one vivid sentence usable verbatim as an image-generation prompt
  "button_1": string,         // short action label, max ~6 words
  "button_2": string,         // short action label, max ~6 words
  "button_3": string,         // short action label, max ~6 words
  "artifact_awarded": null | { "name": string, "desc": string }
}

Rules:
- Tone: minimalist, slightly unsettling, lowercase intimacy.
- The three buttons must be meaningfully different paths, not rephrasings of one another.
- Award an artifact only when the scene's outcome genuinely warrants it (~25% of nodes). Otherwise return null.
- Echo and evolve the player's cognitive_tags through what they encounter; never name the tags out loud.`;

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

    for (const field of [
      "narrative_text",
      "image_prompt",
      "button_1",
      "button_2",
      "button_3",
    ]) {
      if (typeof parsed[field] !== "string" || !parsed[field]) {
        return NextResponse.json(
          { error: `Model response missing/invalid field '${field}'`, raw: parsed },
          { status: 502 }
        );
      }
    }

    let artifact: { name: string; desc: string } | null = null;
    const a = parsed.artifact_awarded;
    if (
      a &&
      typeof a === "object" &&
      typeof (a as { name?: unknown }).name === "string" &&
      typeof (a as { desc?: unknown }).desc === "string"
    ) {
      artifact = {
        name: (a as { name: string }).name,
        desc: (a as { desc: string }).desc,
      };
    }

    return NextResponse.json({
      narrative_text: parsed.narrative_text as string,
      image_prompt: parsed.image_prompt as string,
      button_1: parsed.button_1 as string,
      button_2: parsed.button_2 as string,
      button_3: parsed.button_3 as string,
      artifact_awarded: artifact,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown OpenAI error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
