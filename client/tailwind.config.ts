import type { Config } from "tailwindcss";

// Palette comes from the CrisisWeave logo (slate + deep teal). Severity colours are
// kept separate so red/orange always means "urgent" and never decoration.
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f5f4f0",
        surface: "#ffffff",
        rule: "#e3e0d8",
        ink: "#1f2630",
        slate: { DEFAULT: "#323c4a" },
        muted: "#6b6f76",
        teal: { DEFAULT: "#1a6b6e", dark: "#124f52", soft: "#e3efef" },
        critical: "#b42318",
        high: "#c4520f",
        medium: "#a37b00",
        low: "#2f7a43"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        DEFAULT: "4px"
      }
    }
  },
  plugins: []
};

export default config;
