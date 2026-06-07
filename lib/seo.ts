// Shared SEO copy. Kept in one place so the visible on-page content and the
// structured data (JSON-LD) stay in sync — Google expects FAQ markup to match
// what users actually see on the page.

export const SITE_URL = "https://armaged.online";

export const ABOUT_PARAGRAPHS = [
  "Armaged.online is a free, AI-powered survival game played right in your browser. You face ten escalating Armageddon scenarios — from raining glass and collapsing bridges to the sun vanishing and the end of the universe — and your only weapon is your wits.",
  "For each disaster you write a short survival plan, and an AI Judge weighs it against the real threat to decide whether you SURVIVE or PERISH. Think clearly, act fast, and outlast the apocalypse.",
];

export const HOW_TO_PLAY = [
  "Read the scenario — a deadly Armageddon event, from everyday catastrophes to cosmic, reality-bending threats.",
  "Write your survival plan in 150 characters or less, before the 90-second countdown hits zero.",
  "The AI Judge rules SURVIVED or PERISHED. Survive a level to advance — beat all ten to win.",
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Armaged.online?",
    a: "Armaged.online is a free browser-based survival game. You face ten escalating Armageddon scenarios and must write a short survival plan for each, while an AI Judge decides whether you live or die.",
  },
  {
    q: "How do you play Armaged.online?",
    a: "Read the disaster scenario, then type how you would survive it in 150 characters or less before the 90-second timer runs out. The AI Judge weighs your plan against the threat and rules SURVIVED or PERISHED. Survive to advance through all ten levels.",
  },
  {
    q: "Is Armaged.online free to play?",
    a: "Yes. Armaged.online is completely free and runs in any modern web browser — no download, no installation, and no sign-up required.",
  },
  {
    q: "How does the AI Judge decide if I survive?",
    a: "The AI Judge works out the real lethal mechanism of each scenario and hunts for gaps in your plan. Specific, physically sound plans beat vague ones, and difficulty rises every level, so later scenarios demand near-flawless thinking.",
  },
  {
    q: "Do I need an account to play?",
    a: "No account is required. You can optionally enter a name to appear on the public survivor ranking, sorted by the highest level reached.",
  },
];
