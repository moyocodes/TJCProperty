/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Roboto", "sans-serif"],
        accent: ["Archivo Expanded", "sans-serif"],
      },

      colors: {
        /* ========================
           PRIMARY BROWN
        ========================= */
        primary: {
          50: "#FBEAE2",
          100: "#F5D4C7",
          200: "#EEBBAA",
          300: "#E7A08C",
          400: "#DF866F",
          500: "#D97C5C", // hover color
          600: "#9F4325", // main color
          700: "#7C341C", // dark variant
          800: "#5A2413",
          900: "#37150A",
          foreground: "#FFFFFF",
        },

        /* ========================
           SECONDARY NAVY/STEEL
        ========================= */
        secondary: {
          50: "#E6EBF1",
          100: "#CCD7E3",
          200: "#99B0C7",
          300: "#6689AB",
          400: "#335D8E",
          500: "#1C2A3F", // light
          600: "#0E1A2B", // main
          700: "#0C1422", // dark
          800: "#090F19",
          900: "#05080F",
          foreground: "#FFFFFF",
        },

        /* ========================
           NEUTRALS
        ========================= */
        neutral: {
          50: "#FFFFFF",
          100: "#F1F2F2", // background
          200: "#E5E7EB", // border
          300: "#D1D5DB",
          400: "#A0A0A0", // muted
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#0C0C0C", // text
        },

        /* ========================
           SEMANTIC COLORS
        ========================= */
        success: {
          50: "#ECFDF3",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#16A34A", // main
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          foreground: "#FFFFFF",
        },

        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // main
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          foreground: "#FFFFFF",
        },

        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626", // main
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          foreground: "#FFFFFF",
        },
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      boxShadow: {
        card: "0 8px 30px rgba(0, 0, 0, 0.06)",
        soft: "0 4px 12px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};