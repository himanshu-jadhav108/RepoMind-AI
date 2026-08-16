import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Extended Custom Design System Tokens (Theme-Aware)
        copper: {
          DEFAULT: "hsl(var(--copper-default) / <alpha-value>)",
          hover: "hsl(var(--copper-hover) / <alpha-value>)",
          light: "hsl(var(--copper-light) / <alpha-value>)",
          dim: "hsl(var(--copper-dim) / <alpha-value>)",
        },
        graphite: {
          canvas: "hsl(var(--graphite-canvas) / <alpha-value>)",
          panel: "hsl(var(--graphite-panel) / <alpha-value>)",
          border: "hsl(var(--graphite-border) / <alpha-value>)",
          muted: "hsl(var(--graphite-muted) / <alpha-value>)",
        },
        category: {
          arch: "hsl(var(--category-arch) / <alpha-value>)",
          security: "hsl(var(--category-security) / <alpha-value>)",
          performance: "hsl(var(--category-performance) / <alpha-value>)",
          qa: "hsl(var(--category-qa) / <alpha-value>)",
        },
        severity: {
          critical: "hsl(var(--severity-critical) / <alpha-value>)",
          warning: "hsl(var(--severity-warning) / <alpha-value>)",
          info: "hsl(var(--severity-info) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "typing-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "agent-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(217, 119, 54, 0.4)" },
          "70%": { boxShadow: "0 0 0 8px rgba(217, 119, 54, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(217, 119, 54, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "typing-cursor": "typing-cursor 1s step-end infinite",
        "agent-pulse": "agent-pulse 1.5s ease-out 1",
      },
    },
  },
  plugins: [],
};

export default config;
