"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _tailwindcssanimate = require('tailwindcss-animate'); var _tailwindcssanimate2 = _interopRequireDefault(_tailwindcssanimate);
var _typography = require('@tailwindcss/typography'); var _typography2 = _interopRequireDefault(_typography);

const config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",

        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontWeight: "700",
              fontSize: "1.875rem",
              lineHeight: "2.25rem",
            }, // text-3xl
            h2: { fontWeight: "700", fontSize: "1.5rem", lineHeight: "2rem" }, // text-2xl
            h3: {
              fontWeight: "600",
              fontSize: "1.25rem",
              lineHeight: "1.75rem",
            }, // text-xl
            ul: { paddingLeft: "1.5rem" },
            ol: { paddingLeft: "1.5rem" },
            "ul > li::marker": { color: "inherit" },
            "ol > li::marker": { color: "inherit" },
          },
        },
      },
    },
  },
  plugins: [_tailwindcssanimate2.default, _typography2.default],
};

exports. default = config;
 /* v7-901d6d931f11018a */