import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0F14",
        panel: "#121820",
        line: "#1F2A35",
        ink: "#E6EDF3",
        dim: "#7C8B9A",
        signal: "#3DD6C6",
        risk: "#E0A63D",
        danger: "#E0583D",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
