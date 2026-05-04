const palette = {
  light: {
    primary: "#1B4030",
    primaryDark: "#092015",
    accent: "#C79A20",
    accentLight: "#E8BC38",
    background: "#F4F0E9",
    card: "#EDEADF",
    foreground: "#173626",
    muted: "#DCE8DC",
    mutedForeground: "#557060",
    border: "#C4D4C8",
    destructive: "#D93535",
    success: "#2E9E4F",
    warning: "#E8930A",
    info: "#1A6EB5",
    white: "#FFFFFF",
    tabBar: "#092015",
    tabBarActive: "#C79A20",
    tabBarInactive: "#6B9080",
    radius: 12,
  },
};

export type ColorScheme = typeof palette.light;
export default palette;
