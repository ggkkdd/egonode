import type { GameNode } from "@/lib/types";

export type LoadedNode = {
  node: GameNode;
  imageUrl: string | null;
  audioBlobUrl: string | null;
};

export type FetchParams = {
  action: string;
  current_theme: string | null;
  cognitive_tags: string[];
};

const cache = new Map<string, Promise<LoadedNode>>();

export function getCached(key: string): Promise<LoadedNode> | undefined {
  return cache.get(key);
}

export function setCached(key: string, value: Promise<LoadedNode>): void {
  cache.set(key, value);
}

/** Remove a single entry without disturbing its resolved blob URL. */
export function takeCached(key: string): Promise<LoadedNode> | undefined {
  const v = cache.get(key);
  if (v) cache.delete(key);
  return v;
}

/**
 * Evict every entry from the cache and revoke any object URLs they own
 * (including pending entries — wait for the promise, then revoke).
 */
export function evictAll(): void {
  for (const p of cache.values()) {
    p.then(
      (v) => {
        if (v.audioBlobUrl) URL.revokeObjectURL(v.audioBlobUrl);
      },
      () => {
        /* swallow rejection */
      }
    );
  }
  cache.clear();
}

/**
 * Fetch a full node payload — narrative + image + audio — in parallel.
 * Image and audio failures are tolerated (set to null) so a partial scene
 * still renders rather than blocking on a flaky media provider.
 */
export async function fetchFullNode(
  params: FetchParams
): Promise<LoadedNode> {
  const nodeRes = await fetch("/api/generate-node", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!nodeRes.ok) {
    const err = (await nodeRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `generate-node ${nodeRes.status}`);
  }

  const node = (await nodeRes.json()) as GameNode;

  const [imageUrl, audioBlobUrl] = await Promise.all([
    fetchImage(node.image_prompt).catch(() => null),
    fetchAudio(node.narrative_text).catch(() => null),
  ]);

  if (imageUrl) {
    await preloadImage(imageUrl).catch(() => {
      /* preload best-effort */
    });
  }

  return { node, imageUrl, audioBlobUrl };
}

async function fetchImage(prompt: string): Promise<string> {
  const r = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error(`generate-image ${r.status}`);
  const { image_url } = (await r.json()) as { image_url?: unknown };
  if (typeof image_url !== "string") throw new Error("invalid image url");
  return image_url;
}

async function fetchAudio(text: string): Promise<string> {
  const r = await fetch("/api/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`generate-audio ${r.status}`);
  const blob = await r.blob();
  return URL.createObjectURL(blob);
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image preload failed"));
    img.src = url;
  });
}
