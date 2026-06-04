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
          amber: "#f5a524",
          rust: "#c2410c",
          dim: "#9a3412",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 14px rgba(245, 165, 36, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
