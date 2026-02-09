import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        ar: ['"IBM Plex Sans Arabic"', '"Cairo"', 'sans-serif'],
        en: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // YA Brand Colors
        ya: {
          primary: "hsl(222 38% 19%)",
          accent: "hsl(171 78% 40%)",
          highlight: "hsl(38 91% 50%)",
          bg: "hsl(210 40% 98%)",
          text: "hsl(222 47% 11%)",
          text2: "hsl(215 16% 47%)",
          border: "hsl(214 32% 91%)",
          success: "hsl(142 71% 45%)",
          error: "hsl(0 72% 51%)",
        },
        // System colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        "ya-sm": "10px",
        "ya-md": "14px",
        "ya-lg": "18px",
        xl: "var(--radius)",
        lg: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        "ya-sm": "0 2px 8px rgba(15, 23, 42, 0.08)",
        "ya-md": "0 8px 24px rgba(15, 23, 42, 0.12)",
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      keyframes: {
        "accordion-down": { 
          from: { height: "0", opacity: "0" }, 
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" } 
        },
        "accordion-up": { 
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" }, 
          to: { height: "0", opacity: "0" } 
        },
        "fade-in": { 
          from: { opacity: "0", transform: "translateY(8px)" }, 
          to: { opacity: "1", transform: "translateY(0)" } 
        },
        "fade-in-up": { 
          from: { opacity: "0", transform: "translateY(16px)" }, 
          to: { opacity: "1", transform: "translateY(0)" } 
        },
        "scale-in": { 
          from: { opacity: "0", transform: "scale(0.95)" }, 
          to: { opacity: "1", transform: "scale(1)" } 
        },
        "slide-in-right": { 
          from: { opacity: "0", transform: "translateX(16px)" }, 
          to: { opacity: "1", transform: "translateX(0)" } 
        },
        "slide-in-left": { 
          from: { opacity: "0", transform: "translateX(-16px)" }, 
          to: { opacity: "1", transform: "translateX(0)" } 
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s ease-out",
        "accordion-up": "accordion-up 0.25s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
