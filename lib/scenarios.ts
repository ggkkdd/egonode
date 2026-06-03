import type { Scenario } from "@/lib/types";

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
 */
export const SCENARIOS: Scenario[] = [
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
];

/** All scenarios defined for a given level (1-indexed). */
export function scenariosForLevel(level: number): Scenario[] {
  return SCENARIOS.filter((s) => s.level === level);
}

/**
 * Pick a random scenario for a level. Falls back to the last defined level
 * if an out-of-range level is somehow requested, so the UI never gets `null`.
 */
export function randomScenario(level: number): Scenario {
  const pool = scenariosForLevel(level);
  if (pool.length === 0) {
    const top = scenariosForLevel(MAX_LEVEL);
    return top[Math.floor(Math.random() * top.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
