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
        brand: {
          primary: "#2563eb",
          hover: "#1d4ed8",
          surface: "#f8fafc",
          dark: "#0f172a",
          text: "#475569",
          border: "#e2e8f0",
        }
      },
      // NEW: Centralized Font System
      fontFamily: {
        // Overrides the default "font-sans" utility class
        sans: ['var(--font-inter)', 'sans-serif'],
        // You can add a mono font for your code blocks later if you want!
        // mono: ['var(--font-roboto-mono)', 'monospace'], 
      }
    },
  },
  plugins: [],
};

export default config;