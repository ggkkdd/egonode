// One-off generator: parses "New levels.txt" into a typed Scenario[] module.
// Run once with: node scripts/gen-scenario-pack.mjs "<path to txt>"
// The committed artifact is lib/scenarios-pack-2.ts; this script is disposable.
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node gen-scenario-pack.mjs <txt path>");
  process.exit(1);
}

const text = readFileSync(src, "utf8");
const lines = text.split(/\r?\n/);

// "Level 1:", "Level4:", "level 10:" → start a level. "### Level 5: ..." subheaders
// and blank lines are ignored. Numbered "N. **Title:** desc **Task: Survive.**".
const levelHeader = /^level\s*(\d+)\s*:/i;
const scenarioLine = /^\d+\.\s*\*\*(.+?):\*\*\s*(.*?)\s*\*\*Task:\s*Survive\.\*\*\s*$/i;

let level = 0;
const out = [];
for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith("#")) continue; // markdown subheaders like "### Level 5: ..."
  const h = line.match(levelHeader);
  if (h) {
    level = Number(h[1]);
    continue;
  }
  const m = line.match(scenarioLine);
  if (!m) continue; // skip anything that isn't a scenario row
  if (!level) throw new Error(`Scenario before any level header: ${line}`);
  out.push({ level, title: m[1].trim(), description: m[2].trim() });
}

// Sanity: expect 50 per level for levels 1..10.
const counts = {};
for (const s of out) counts[s.level] = (counts[s.level] || 0) + 1;
console.error("counts", counts, "total", out.length);
for (let l = 1; l <= 10; l++) {
  if (counts[l] !== 50) throw new Error(`Level ${l} has ${counts[l] ?? 0}, expected 50`);
}

const body = out
  .map(
    (s) =>
      `  {\n    level: ${s.level},\n    title: ${JSON.stringify(
        s.title
      )},\n    description:\n      ${JSON.stringify(s.description)},\n  },`
  )
  .join("\n");

const file = `import type { Scenario } from "@/lib/types";

/**
 * Second scenario pack — 50 additional scenarios per level (500 total),
 * generated from the curated source list and appended to SCENARIOS in
 * lib/scenarios.ts. Kept in its own module so the hand-written base list
 * stays readable. Do not edit by hand; regenerate from the source text.
 */
export const SCENARIO_PACK_2: Scenario[] = [
${body}
];
`;

writeFileSync(new URL("../lib/scenarios-pack-2.ts", import.meta.url), file);
console.error("wrote lib/scenarios-pack-2.ts");
