import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        flux: {
          canvas: "#EDEDED",
          sidebar: "#171717",
          "card-dark": "#1A1A1A",
          lime: "#D6F63E",
          lavender: "#C4B5F5",
          "text-primary": "#0F0F0F",
          "text-secondary": "#6B6B6B",
          "text-dark-primary": "#FFFFFF",
          "text-dark-secondary": "#A0A0A0",
          border: "#E5E5E5",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "24px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 2px 4px 0 rgba(0,0,0,0.06)",
        "card-hover": "0 4px 8px 0 rgba(0,0,0,0.08)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
