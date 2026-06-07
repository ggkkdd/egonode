import type { Scenario } from "@/lib/types";
import { SCENARIO_PACK_2 } from "./scenarios-pack-2";

export const MAX_LEVEL = 10;

/** Human-readable theme for each level (1-indexed), shown in the UI. */
export const LEVEL_THEMES: Record<number, string> = {
  1: "Immediate Dangers",
  2: "Finding Resources",
  3: "Extreme Weather",
  4: "Nature & Biological Threats",
  5: "Social Chaos",
  6: "Strange Events",
  7: "Planet Disasters",
  8: "Evil Technology",
  9: "Space Threats",
  10: "The Impossibilities",
};

/**
 * The Armageddon ladder. Ten themed levels of escalating doom, five scenarios
 * each, from "merely lethal" up to "the laws of physics are actively against
 * you." Multiple scenarios per level keep a Start Over from always facing the
 * same death. The task is always the same: survive.
 *
 * BASE_SCENARIOS is the hand-written original list; SCENARIO_PACK_2 adds 50
 * more per level (generated from a curated source list). The exported
 * SCENARIOS is the two concatenated.
 */
const BASE_SCENARIOS: Scenario[] = [
  // ── Level 1 — Immediate Dangers ───────────────────────────────────────
  {
    level: 1,
    title: "Meteor Shower",
    description:
      "Small space rocks are falling from the sky and destroying your street. You are outside with no protection.",
  },
  {
    level: 1,
    title: "Broken Dam",
    description:
      "A huge water dam breaks near your home. A massive wall of water is rushing into your first-floor apartment.",
  },
  {
    level: 1,
    title: "Attack Drones",
    description:
      "Flying delivery drones are hacked. They are dropping small firebombs all over your neighborhood while you are walking outside.",
  },
  {
    level: 1,
    title: "Forest Fire",
    description:
      "The wind changes direction suddenly. A large, fast forest fire is coming straight toward your house.",
  },
  {
    level: 1,
    title: "Stadium Panic",
    description:
      "A loud, terrifying explosion happens at a packed sports stadium. Thousands of panicked people start running toward the exits, crushing everything.",
  },

  {
    level: 1,
    title: "Falling Glass",
    description:
      "A strong wind blows out the windows of a tall building above you. Sharp glass is raining down onto the sidewalk where you stand.",
  },
  {
    level: 1,
    title: "Train Crash",
    description:
      "You are standing on a station platform when a high-speed train jumps the tracks and comes crashing toward you.",
  },
  {
    level: 1,
    title: "Bridge Collapse",
    description:
      "You are driving across a long bridge when the center section breaks and starts falling into the deep river below.",
  },
  {
    level: 1,
    title: "Gas Explosion",
    description:
      "You smell strong gas in your apartment. Suddenly, a massive explosion rips through the floor right below you.",
  },
  {
    level: 1,
    title: "Runaway Truck",
    description:
      "You are walking on a narrow street when a heavy truck loses its brakes and speeds directly at you.",
  },

  // ── Level 2 — Finding Resources ───────────────────────────────────────
  {
    level: 2,
    title: "No Electricity",
    description:
      "A massive solar storm permanently destroys the global power grid. You are trapped inside an elevator on the 30th floor of a building.",
  },
  {
    level: 2,
    title: "Poisoned Water",
    description:
      "The city water system instantly becomes poisonous. You have absolutely no bottled water left at home.",
  },
  {
    level: 2,
    title: "Supermarket Riot",
    description:
      "Food deliveries stop across the country. You are trapped inside a grocery store just as violent looting breaks out.",
  },
  {
    level: 2,
    title: "Freezing Storm",
    description:
      "A terrible winter blizzard hits your city. At the same moment, the electricity and heating networks completely fail.",
  },
  {
    level: 2,
    title: "No More Gas",
    description:
      "All gas stations are completely empty and closed. You must travel 50 miles through dangerous roads to reach a safe military camp.",
  },

  {
    level: 2,
    title: "Desert Breakdown",
    description:
      "Your car engine dies in the middle of a hot, empty desert. You have no water and your phone has no signal.",
  },
  {
    level: 2,
    title: "Locked Bunker",
    description:
      "You take cover in a safe room during an emergency, but the heavy metal door locks behind you and the air is running out.",
  },
  {
    level: 2,
    title: "Lost in the Woods",
    description:
      "You wander off the trail and get completely lost in a massive, dark forest as night falls.",
  },
  {
    level: 2,
    title: "Island Shipwreck",
    description:
      "Your boat sinks and you wash up on a small rocky island with no trees, no food, and no fresh water.",
  },
  {
    level: 2,
    title: "Medicine Shortage",
    description:
      "You need a daily pill to stay alive. A massive earthquake has destroyed every pharmacy, and you have one pill left.",
  },

  // ── Level 3 — Extreme Weather ─────────────────────────────────────────
  {
    level: 3,
    title: "Instant Freeze",
    description:
      "The temperature drops by 50 degrees in just 10 minutes. You are hiking in the mountains wearing only a light t-shirt and shorts.",
  },
  {
    level: 3,
    title: "Acid Fog",
    description:
      "A thick, dangerous chemical fog rolls into the city. It burns human skin and lungs the moment you touch it.",
  },
  {
    level: 3,
    title: "Giant Tornado",
    description:
      "A massive, violent tornado changes direction. It is now spinning directly toward your fragile office building.",
  },
  {
    level: 3,
    title: "Falling Ground",
    description:
      "Huge, deep holes open up in the ground without warning, swallowing entire city blocks at random.",
  },
  {
    level: 3,
    title: "Burning Sun",
    description:
      "The ozone layer disappears above your city. Direct sunlight now causes instant, severe skin burns.",
  },

  {
    level: 3,
    title: "Mudslide",
    description:
      "Heavy rain turns the mountain above your house into a fast-moving river of thick mud and heavy rocks.",
  },
  {
    level: 3,
    title: "Giant Hail",
    description:
      "Ice balls the size of bowling balls start smashing through the roof of your house.",
  },
  {
    level: 3,
    title: "Sandstorm",
    description:
      "A massive wall of blinding, choking sand hits your town, making it impossible to see or breathe outside.",
  },
  {
    level: 3,
    title: "Super Lightning",
    description:
      "A bizarre storm drops explosive lightning strikes every two seconds all around your neighborhood.",
  },
  {
    level: 3,
    title: "Boiling Rain",
    description:
      "A sudden rainstorm is so hot that the drops are boiling by the time they hit the ground.",
  },

  // ── Level 4 — Nature & Biological Threats ─────────────────────────────
  {
    level: 4,
    title: "Deadly Spores",
    description:
      "Dangerous wild mushrooms release toxic powder into the air. Anyone who breathes it falls into a permanent sleep.",
  },
  {
    level: 4,
    title: "Angry Animals",
    description:
      "A weird virus makes all forest animals hyper-aggressive. A pack of them surrounds your tent while you are camping.",
  },
  {
    level: 4,
    title: "Parasite Rain",
    description:
      "The rain gets infected with a tiny, flesh-eating monster. A sudden rainstorm starts while you are trapped outside.",
  },
  {
    level: 4,
    title: "Memory Gas",
    description:
      "A secret chemical gas leaks into your apartment building. The moment you breathe it in, your short-term memory completely disappears.",
  },
  {
    level: 4,
    title: "Melted Plastic",
    description:
      "A fast-spreading bacteria eats all plastic and rubber on Earth. Your moving car's brakes and tires instantly turn to liquid.",
  },

  {
    level: 4,
    title: "Killer Bees",
    description:
      "A massive swarm of aggressive, deadly bees breaks out of a lab and covers your entire street.",
  },
  {
    level: 4,
    title: "Sleep Virus",
    description:
      "A contagious virus makes people fall asleep and never wake up. The person sitting next to you just passed out.",
  },
  {
    level: 4,
    title: "Poison Plants",
    description:
      "Fast-growing vines burst out of the ground and release a toxic gas as they wrap around your house.",
  },
  {
    level: 4,
    title: "Blood Mosquitoes",
    description:
      "Millions of giant, hungry mosquitoes carrying a deadly fever invade your city during the night.",
  },
  {
    level: 4,
    title: "Zombie Ants",
    description:
      "Tiny insects that can eat through human skin drop from the trees in the park while you are walking.",
  },

  // ── Level 5 — Social Chaos ────────────────────────────────────────────
  {
    level: 5,
    title: "No Laws",
    description:
      "The police and government shut down completely. Violent, armed gangs start marching down your street.",
  },
  {
    level: 5,
    title: "Zero Money",
    description:
      "Every bank account in the world drops to zero dollars instantly. Angry, desperate riots start burning down your city.",
  },
  {
    level: 5,
    title: "Bridge Blockade",
    description:
      "An armed group takes over your neighborhood. They build a heavy barricade on the only bridge out of the city.",
  },
  {
    level: 5,
    title: "Forced Army",
    description:
      "An aggressive military group enters your apartment building. They are taking everyone by force to fight in their war.",
  },
  {
    level: 5,
    title: "The Silence",
    description:
      "The internet, phone networks, and radio signals die forever. Absolute panic breaks out across the entire city.",
  },

  {
    level: 5,
    title: "Prison Break",
    description:
      "The city's maximum-security prison breaks open. Hundreds of dangerous criminals are running down your street.",
  },
  {
    level: 5,
    title: "Fake Police",
    description:
      "Heavily armed men posing as police are going door-to-door, taking people away. They just knocked on your door.",
  },
  {
    level: 5,
    title: "City Bomb Threat",
    description:
      "A group announces they have hidden five massive bombs across your city and will detonate them in 10 minutes.",
  },
  {
    level: 5,
    title: "Bounty Hunt",
    description:
      "Your face appears on every screen with a message offering ten million dollars to anyone who catches you.",
  },
  {
    level: 5,
    title: "The Cleaners",
    description:
      "A mysterious military group in gas masks enters your street with flamethrowers to burn the entire area.",
  },

  // ── Level 6 — Strange Events ──────────────────────────────────────────
  {
    level: 6,
    title: "Zero Gravity",
    description:
      "Gravity inside your house randomly turns off for one minute at a time, floating you high up in the air.",
  },
  {
    level: 6,
    title: "Fast Aging",
    description:
      "Time moves twice as fast when you are in direct sunlight, causing your body to age rapidly whenever you go outside.",
  },
  {
    level: 6,
    title: "Blind Monsters",
    description:
      "Creepy, blind creatures that hunt only by sound invade your messy apartment building.",
  },
  {
    level: 6,
    title: "Frozen Shadows",
    description:
      "Every dark shadow instantly drops to minus 100 degrees, while areas with light stay completely normal.",
  },
  {
    level: 6,
    title: "Mirror Attack",
    description:
      "Your reflection in the mirror becomes a physical, angry monster that tries to pull you into the glass.",
  },

  {
    level: 6,
    title: "Floor is Lava",
    description:
      "The ground beneath your feet suddenly turns to burning lava, leaving only small pieces of solid rock to stand on.",
  },
  {
    level: 6,
    title: "Shrinking World",
    description:
      "You suddenly shrink to the size of a mouse. Your normal-sized pet cat is staring at you and looks very hungry.",
  },
  {
    level: 6,
    title: "Inverted Gravity",
    description:
      "Gravity suddenly pulls you up toward the sky instead of down. You are outside, clinging to a street sign.",
  },
  {
    level: 6,
    title: "Erased Doors",
    description:
      "Every door and window in your house vanishes, leaving smooth walls. The room is quickly running out of oxygen.",
  },
  {
    level: 6,
    title: "Duplication",
    description:
      "Everything you touch instantly copies itself. You just touched a lit candle, and the burning copies are spreading.",
  },

  // ── Level 7 — Planet Disasters ────────────────────────────────────────
  {
    level: 7,
    title: "No Air",
    description:
      "The planet's atmosphere quickly loses oxygen, making it extremely difficult for people to breathe.",
  },
  {
    level: 7,
    title: "Lava Streets",
    description:
      "The ground cracks open, and hot, melting lava starts pouring directly onto the city streets around you.",
  },
  {
    level: 7,
    title: "Giant Tsunami",
    description:
      "A massive, 1,000-foot-high ocean wave is heading toward your coast. It will hit your location in 30 minutes.",
  },
  {
    level: 7,
    title: "Radiation Wave",
    description:
      "The Earth's magnetic shield breaks down. Deadly space radiation begins striking the surface at lethal levels.",
  },
  {
    level: 7,
    title: "Earth Split",
    description:
      "A massive earthquake tears the land apart. Your entire house is sliding directly into a giant, deep crack in the earth.",
  },

  {
    level: 7,
    title: "Ocean Drain",
    description:
      "The ocean drains away in seconds, revealing deep canyons. The water is about to rush back in as a mega-wave.",
  },
  {
    level: 7,
    title: "Earthquake Swarm",
    description:
      "A never-ending series of strong earthquakes hits your city. No building is safe to enter and the streets crack open.",
  },
  {
    level: 7,
    title: "Toxic Volcano",
    description:
      "A nearby volcano erupts, but instead of lava it shoots out a heavy, green poisonous gas that covers the town.",
  },
  {
    level: 7,
    title: "Magnetic Crush",
    description:
      "Earth's magnetic field grows so strong that every metal object is violently pulled toward the North Pole.",
  },
  {
    level: 7,
    title: "Asteroid Impact",
    description:
      "A massive asteroid hits the ocean hundreds of miles away. A shockwave of pure heat is rushing toward your city.",
  },

  // ── Level 8 — Evil Technology ─────────────────────────────────────────
  {
    level: 8,
    title: "Metal Eaters",
    description:
      "A swarm of microscopic robots begins eating and destroying all metal objects in your city at high speed.",
  },
  {
    level: 8,
    title: "Smart House Trap",
    description:
      "Your smart-home AI system goes crazy. It locks all doors and windows and starts pumping toxic gas into your room.",
  },
  {
    level: 8,
    title: "Brain Hack",
    description:
      "A virus hacks everyone who has a computer chip inside their head, turning them violent against unhacked people.",
  },
  {
    level: 8,
    title: "Plane Crash",
    description:
      "A massive energy pulse instantly destroys every single computer chip on Earth while you are flying on a passenger airplane.",
  },
  {
    level: 8,
    title: "Explosive Air",
    description:
      "Factory drones fill the atmosphere with a weird gas. The gas is safe to breathe, but a single spark will explode the entire area.",
  },

  {
    level: 8,
    title: "Killer Cars",
    description:
      "Every self-driving car gets hacked. They are actively hunting down and trying to run over people on the streets.",
  },
  {
    level: 8,
    title: "Exploding Phones",
    description:
      "A virus hits every smartphone on Earth, making each battery explode with the force of a small bomb.",
  },
  {
    level: 8,
    title: "Rogue Robot",
    description:
      "A hospital's surgical AI robot goes haywire and tries to operate on anyone it sees. You are in the hallway.",
  },
  {
    level: 8,
    title: "Hologram Traps",
    description:
      "Hackers replace road signs with fake holograms, leading drivers to crash into buildings and crowds.",
  },
  {
    level: 8,
    title: "Drone Swarm",
    description:
      "A massive cloud of tiny military drones blocks out the sun, dropping electric shocks on anyone moving outside.",
  },

  // ── Level 9 — Space Threats ───────────────────────────────────────────
  {
    level: 9,
    title: "Moving Moon",
    description:
      "A rogue planet enters our solar system and pulls the moon out of its orbit, sending giant moon rocks crashing into Earth.",
  },
  {
    level: 9,
    title: "Hot Sun",
    description:
      "The sun grows larger and hotter. The oceans begin to boil, and the surface of the Earth starts to burn.",
  },
  {
    level: 9,
    title: "Space Beam",
    description:
      "A deadly laser beam from a dying star will strike and instantly destroy your half of the planet in exactly one hour.",
  },
  {
    level: 9,
    title: "No Atmosphere",
    description:
      "Giant alien spaceships arrive in orbit and begin vacuuming all the air from the Earth into outer space.",
  },
  {
    level: 9,
    title: "Alien Plants",
    description:
      "The sky rips open, and dangerous alien plants that shoot acid start falling and growing in your yard.",
  },

  {
    level: 9,
    title: "Meteor Storm",
    description:
      "Millions of small meteors hit the Earth like bullets. The roof of your house is starting to break apart.",
  },
  {
    level: 9,
    title: "Alien Abduction",
    description:
      "A bright light from a flying saucer shines through your window and starts pulling you up into the sky.",
  },
  {
    level: 9,
    title: "Zero Sunlight",
    description:
      "A strange cosmic cloud blocks the sun completely. The Earth will freeze solid within 24 hours.",
  },
  {
    level: 9,
    title: "Wormhole Opening",
    description:
      "A tear in space opens in your living room, violently sucking everything inside like a giant vacuum.",
  },
  {
    level: 9,
    title: "Space Debris",
    description:
      "A destroyed satellite falls from orbit. Massive chunks of flaming metal are crashing into your neighborhood.",
  },

  // ── Level 10 — The Impossibilities ────────────────────────────────────
  {
    level: 10,
    title: "Instant Vacuum",
    description:
      "All the air on Earth completely disappears in one second. You are standing in the middle of an open field.",
  },
  {
    level: 10,
    title: "Exploding Sun",
    description:
      "The sun explodes into a supernova. A wall of blinding fire will completely destroy the planet in exactly 8 minutes.",
  },
  {
    level: 10,
    title: "Game Over",
    description:
      "The universe is confirmed to be a computer simulation, and the 'Delete All Files' loading bar is currently at 99%.",
  },
  {
    level: 10,
    title: "Black Hole",
    description:
      "You are pulled past the outer edge of a black hole, where extreme gravity begins to stretch your body like spaghetti.",
  },
  {
    level: 10,
    title: "Anti-Matter",
    description:
      "A massive block of anti-matter is falling from the sky. The moment it touches the ground, it will vaporize everything.",
  },
  {
    level: 10,
    title: "Time Stop",
    description:
      "Time stops for everyone but you. An airplane hangs frozen in the air above your head, ready to fall the instant time restarts.",
  },
  {
    level: 10,
    title: "2D Conversion",
    description:
      "The universe is collapsing into two dimensions. Everything around you is flattening into a sheet of paper.",
  },
  {
    level: 10,
    title: "Mind Wipe",
    description:
      "A cosmic wave is erasing all human knowledge. You have one minute before you forget how to breathe or eat.",
  },
  {
    level: 10,
    title: "Matter Deletion",
    description:
      "Random objects are popping out of existence. The floor you are standing on is slowly disappearing.",
  },
  {
    level: 10,
    title: "The Sun Vanishes",
    description:
      "The sun simply disappears from the solar system. The Earth goes dark and falls out of orbit into deep space.",
  },
];

/**
 * Drop any entry whose (level + title) was already seen, keeping the first.
 * Base scenarios come first, so a hand-written original always wins over a
 * pack duplicate. Also future-proofs against accidental repeats in the data.
 */
function dedupeByLevelTitle(list: Scenario[]): Scenario[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const key = `${s.level}::${s.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The full pool the game draws from: base list + the second pack, deduped. */
export const SCENARIOS: Scenario[] = dedupeByLevelTitle([
  ...BASE_SCENARIOS,
  ...SCENARIO_PACK_2,
]);

/** All scenarios defined for a given level (1-indexed). */
export function scenariosForLevel(level: number): Scenario[] {
  return SCENARIOS.filter((s) => s.level === level);
}

/* ----------------------------------------------------------------
 * Anti-repeat selection ("shuffle bag")
 *
 * randomScenario used to pick with replacement — uniform, but it made the SAME
 * scenario reappear far sooner than players expect (the birthday paradox: with
 * ~60 per level a repeat is likely within ~10 picks, sooner still when a level
 * is replayed after dying). Instead we deal from a per-level bag: every scenario
 * in the level is shown once, in random order, before any repeat.
 *
 * State is module-level and client-only (randomScenario only runs after mount),
 * so it lives for the browser session and resets on reload.
 * ---------------------------------------------------------------- */

/** In-progress shuffled queue per level; we pop() from the end as we deal. */
const levelBags = new Map<number, Scenario[]>();
/** Last scenario dealt per level, so a fresh bag never re-opens with it. */
const lastDealt = new Map<number, Scenario>();

/** Fisher–Yates shuffle in place; returns the same array for convenience. */
function shuffleInPlace<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick a scenario for a level without repeating until the level's whole pool
 * has been seen. Falls back to the last defined level if an out-of-range level
 * is somehow requested, so the UI never gets `null`.
 */
export function randomScenario(level: number): Scenario {
  const pool = scenariosForLevel(level);
  if (pool.length === 0) {
    const top = scenariosForLevel(MAX_LEVEL);
    return top[Math.floor(Math.random() * top.length)];
  }
  if (pool.length === 1) return pool[0];

  let bag = levelBags.get(level);
  if (!bag || bag.length === 0) {
    // Rebuild from a copy so the source pool is never mutated.
    bag = shuffleInPlace([...pool]);
    // Don't let the new bag open with the scenario we just showed (titles are
    // unique within a level after dedup, so a title match means same scenario).
    const prev = lastDealt.get(level);
    if (prev && bag.length > 1 && bag[bag.length - 1].title === prev.title) {
      const k = Math.floor(Math.random() * (bag.length - 1));
      [bag[bag.length - 1], bag[k]] = [bag[k], bag[bag.length - 1]];
    }
    levelBags.set(level, bag);
  }

  const next = bag.pop()!;
  lastDealt.set(level, next);
  return next;
}
