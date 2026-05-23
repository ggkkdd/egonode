import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#121212",
          panel: "rgba(18, 18, 18, 0.85)",
          edge: "#1c1c1c",
        },
        accent: {
          green: "#00FF00",
          dim: "#00cc00",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 12px rgba(0, 255, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
