import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // white/gray are wired to CSS variables (see globals.css) so they
        // flip automatically under the .dark class without touching every
        // component that already uses the standard Tailwind gray scale.
        white: "rgb(var(--c-white) / <alpha-value>)",
        gray: {
          50: "rgb(var(--c-gray-50) / <alpha-value>)",
          100: "rgb(var(--c-gray-100) / <alpha-value>)",
          200: "rgb(var(--c-gray-200) / <alpha-value>)",
          300: "rgb(var(--c-gray-300) / <alpha-value>)",
          400: "rgb(var(--c-gray-400) / <alpha-value>)",
          500: "rgb(var(--c-gray-500) / <alpha-value>)",
          600: "rgb(var(--c-gray-600) / <alpha-value>)",
          700: "rgb(var(--c-gray-700) / <alpha-value>)",
          800: "rgb(var(--c-gray-800) / <alpha-value>)",
          900: "rgb(var(--c-gray-900) / <alpha-value>)",
        },
        // Centered on the real BNK Commercial Bank logo red (#D80010).
        brand: {
          50: "#fdecec",
          100: "#fad0d2",
          200: "#f4a2a6",
          300: "#ec6d73",
          400: "#e2373e",
          500: "#d2000f",
          600: "#d80010",
          700: "#a80009",
          800: "#7a0007",
          900: "#4f0005",
        },
        // The warm gray-brown used for "Commercial Bank" in the logo wordmark.
        ink: "#6f6350",
      },
    },
  },
  plugins: [],
};

export default config;
