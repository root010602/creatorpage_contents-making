import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "rgb(255, 131, 4)", // Tourlive Orange
          light: "rgb(255, 160, 64)",
          dark: "rgb(230, 110, 0)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          border: "var(--surface-border)",
        },
        brand: {
          orange: "rgb(255, 131, 4)",
          "orange-50": "rgba(255, 131, 4, 0.05)",
          "orange-100": "rgba(255, 131, 4, 0.1)",
        }
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
