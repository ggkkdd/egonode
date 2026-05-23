import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAL_MODEL = "fal-ai/fast-lightning-sdxl";
const FAL_ENDPOINT = `https://fal.run/${FAL_MODEL}`;

export async function POST(req: NextRequest) {
  let body: { prompt?: unknown };
  try {
    body = (await req.json()) as { prompt?: unknown };
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Missing 'prompt' (string) in body" },
      { status: 400 }
    );
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "FAL_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(FAL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `${prompt}, cinematic, minimalist, dark moody atmosphere, deep shadows, subtle green rim light`,
        negative_prompt:
          "text, watermark, logo, signature, blurry, low quality, cartoonish",
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!upstream.ok) {
      const raw = await upstream.text();
      return NextResponse.json(
        { error: `fal.ai ${upstream.status}: ${raw.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as {
      images?: Array<{ url?: unknown }>;
    };
    const url = data.images?.[0]?.url;
    if (typeof url !== "string") {
      return NextResponse.json(
        { error: "fal.ai response missing image url", raw: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ image_url: url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown fal.ai error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
