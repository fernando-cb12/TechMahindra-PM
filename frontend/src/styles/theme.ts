import { createTheme } from "@mui/material/styles";

// COLOR TOKENS
const brand = {
  main: "#7A0026",
  dark: "#5A001C",
  light: "#A3334D",
  contrastText: "#FFFFFF",
};

const grey = {
  50: "#F7F7F7",
  100: "#EFEFEF",
  200: "#E0E0E0",
  300: "#C7C7C7",
  400: "#A0A0A0",
  500: "#707070",
  600: "#505050",
  700: "#303030",
  800: "#1F1F1F",
  900: "#121212",
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

    primary: brand,

    grey: grey,

    background: {
      default: grey[50],
      paper: "#FFFFFF",
    },

    text: {
      primary: grey[800],
      secondary: grey[500],
      disabled: grey[400],
    },

    success: {
      main: "#4CAF50",
      light: "#81C784",
      dark: "#388E3C",
    },

    warning: {
      main: "#F4B400",
      light: "#FFD54F",
      dark: "#C49000",
    },

    error: {
      main: "#E53935",
      light: "#EF5350",
      dark: "#B71C1C",
    },

    info: {
      main: "#2196F3",
      light: "#64B5F6",
      dark: "#1976D2",
    },

    divider: grey[200],
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
      ...brand,
      main: brand.light,
    },

    grey: grey,

    background: {
      default: grey[900],
      paper: grey[800],
    },

    text: {
      primary: "#FFFFFF",
      secondary: grey[300],
      disabled: grey[500],
    },

    success: {
      main: "#66BB6A",
    },

    warning: {
      main: "#FFCA28",
    },

    error: {
      main: "#EF5350",
    },

    info: {
      main: "#42A5F5",
    },

    divider: grey[700],
  },

  typography,

  shape: {
    borderRadius: 8,
  },
});
