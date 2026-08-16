/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171C",
        paper: "#EDEFEF",
        teal: {
          DEFAULT: "#0E4F45",
          deep: "#0A3A33",
        },
        gold: "#C89B3C",
        hairline: "#D5D7D4",
        brick: "#B23B2E",
        muted: "#5B6472",
      },
      fontFamily: {
        // Serif is for headlines only — it carries the institutional register.
        display: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        // Mono is reserved for numbers, so data reads as data.
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Deliberately restrained: no border-radius theatrics.
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "meter-fill": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms ease-out both",
        "meter-fill": "meter-fill 520ms cubic-bezier(0.2, 0.7, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
