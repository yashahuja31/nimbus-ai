import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Control-room graphite, not pure black -- panel sits one step up.
        base: "#0A0C10",
        panel: "#14171D",
        line: "#262B33",
        ink: "#EEF1F5",
        dim: "#7C8492",
        // Brand accent: the "signal traveling through the pipeline."
        pulse: "#6C8CFF",
        // Status semantics -- these encode real plan/step states, not decoration.
        amber: "#F0A445",
        coral: "#FF6B5E",
        mint: "#52E3A4",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(108, 140, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
