import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          500: "#4f6ef7",
          600: "#4561E8",
          700: "#3451d1",
          900: "#1a2d80",
        },
        // Semantic tokens pointing to CSS variables
        surface:    "var(--bg)",
        "surface-2":"var(--bg-secondary)",
        card:       "var(--bg-card)",
        primary:    "var(--text)",
        secondary:  "var(--text-secondary)",
        muted:      "var(--text-muted)",
        outline:    "var(--border)",
      },
      fontFamily: {
        sans: ["var(--font-golos)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
