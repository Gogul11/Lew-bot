export const lightTheme = {
  colors: {
    background: "#FFF9F2",
    surface: "#FFFFFF",
    primary: "#F97316",
    primaryDark: "#C2410C",
    text: "#1F2937",
    textMuted: "#6B7280",
    border: "#FED7AA",
    danger: "#DC2626",
    success: "#15803D"
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24
  }
} as const;

export type AppTheme = typeof lightTheme;
