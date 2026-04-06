/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "brand-background": "rgb(var(--color-background) / <alpha-value>)",
        "brand-surface": "rgb(var(--color-surface) / <alpha-value>)",
        "brand-primary": "rgb(var(--color-primary) / <alpha-value>)",
        "brand-primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        "brand-text": "rgb(var(--color-text) / <alpha-value>)",
        "brand-text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "brand-border": "rgb(var(--color-border) / <alpha-value>)",
        "brand-danger": "rgb(var(--color-danger) / <alpha-value>)",
        "brand-success": "rgb(var(--color-success) / <alpha-value>)"
      }
    },
  },
  plugins: [],
}
