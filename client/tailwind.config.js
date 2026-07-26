/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sherlock: {
          bg: "#05070E", bg2: "#080C16", panel: "#0C1220", panelHi: "#111A2D",
          line: "#1A2338", lineHi: "#27334F", text: "#E8EEF9", dim: "#8A9AB8",
          mut: "#6B7A98", steel: "#5B8DEF", ice: "#7DD3FC", cyan: "#22D3EE",
          green: "#34D399", amber: "#FBBF24", red: "#FF4D6D",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
