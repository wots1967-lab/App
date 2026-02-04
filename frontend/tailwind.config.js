/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-main': '#6C63FF',
        'primary-dark': '#4834DF',
        'secondary-main': '#2ECC71',
        'accent-gold': '#FFD700',
        'accent-orange': '#FFA500',
        'accent-red': '#E74C3C',
        'bg-dark': '#0B0C15',
        'bg-dark-card': '#151621',
        'bg-light': '#F4F6F8',
        'bg-light-card': '#FFFFFF',
        'text-dark-primary': '#FFFFFF',
        'text-dark-secondary': '#A0AEC0',
        'text-light-primary': '#1A202C',
        'text-light-secondary': '#718096',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        'heading': ['Exo 2', 'sans-serif'],
        'body': ['Rubik', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108, 99, 255, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(108, 99, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}