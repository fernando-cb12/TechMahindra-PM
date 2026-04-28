import { createTheme } from "@mui/material/styles";

// Shared colors currently used across pages/components.
const colors = {
  primary: {
    main: "#5F0229",
    dark: "#4A011F",
    light: "#A3334D",
    contrastText: "#FFFFFF",
  },
  neutral: {
    white: "#FFFFFF",
    black: "#000000",
    50: "#F7F7F7",
    100: "#F2F3F5",
    200: "#E8E8E8",
    300: "#D9D9D9",
    400: "#B3B3B3",
    500: "#9F9F9F",
    600: "#7C7C7C",
    700: "#444444",
    800: "#2C2C2C",
    900: "#121212",
  },
  surface: {
    sidebar: "#29251D",
  },
  status: {
    success: "#4CAF50",
    warning: "#EAC24F",
    error: "#FB485B",
    lowPriority: "#20EA37",
  },
};

// TYPOGRAPHY
const typography = {
  fontFamily: "'Montserrat', 'Roboto', sans-serif",

  fontSize: 14,

  h1: { fontSize: 36, fontWeight: 600 },
  h2: { fontSize: 30, fontWeight: 600 },
  h3: { fontSize: 24, fontWeight: 500 },

  body1: { fontSize: 16 },
  body2: { fontSize: 14 },

  caption: { fontSize: 12 },

  button: {
    fontSize: 14,
    fontWeight: 500,
    textTransform: "none" as const,
  },
};

// LIGHT THEME
export const lightTheme = createTheme({
  palette: {
    mode: "light",

    primary: colors.primary,
    secondary: {
      main: colors.surface.sidebar,
      contrastText: colors.neutral.white,
    },
    grey: colors.neutral,

    background: {
      default: colors.neutral[50],
      paper: colors.neutral.white,
    },

    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
      disabled: colors.neutral[500],
    },

    success: {
      main: colors.status.success,
    },

    warning: {
      main: colors.status.warning,
    },

    error: {
      main: colors.status.error,
    },

    info: {
      main: colors.primary.light,
    },

    divider: colors.neutral[100],
  },

  typography,

  shape: {
    borderRadius: 8,
  },
});

// DARK THEME
export const darkTheme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      ...colors.primary,
      main: colors.primary.main,
    },
    secondary: {
      main: colors.surface.sidebar,
      contrastText: colors.neutral.white,
    },
    grey: colors.neutral,

    background: {
      default: colors.neutral[800],
      paper: colors.neutral[700],
    },

    text: {
      primary: '#F5F5F5',
      secondary: colors.neutral[300],
      disabled: colors.neutral[500],
    },

    success: {
      main: colors.status.success,
    },

    warning: {
      main: colors.status.warning,
    },

    error: {
      main: colors.status.error,
    },

    info: {
      main: colors.primary.main,
    },

    divider: colors.neutral[700],
  },

  typography,

  shape: {
    borderRadius: 8,
  },
});
