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
        // Dark design system
        page: {
          bg: "#080C14",
        },
        surface: {
          DEFAULT: "#0D1117",
          bg: "#F8FAFC", // keep for dashboard
          card: "#FFFFFF",
        },
        dark: {
          border: "#1E2D3D",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E3A8A",
          glow: "rgba(59, 130, 246, 0.15)",
        },
        accent: {
          cyan: "#06B6D4",
        },
        txt: {
          primary: "#F0F6FC",
          secondary: "#8B949E",
        },
        "success-green": "#238636",
        earnings: "#10B981",
      },
      borderRadius: {
        card: "16px",
        btn: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(59, 130, 246, 0.4)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.15)",
        subtle: "0 1px 2px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "float-mock": "floatMock 4s ease-in-out infinite",
        "drift-grid": "driftGrid 20s linear infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        floatMock: {
          "0%, 100%": { transform: "translateY(-8px)" },
          "50%": { transform: "translateY(8px)" },
        },
        driftGrid: {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(60px, 60px)" },
        },
        shimmer: {
          "0%": { left: "-100%" },
          "100%": { left: "200%" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
