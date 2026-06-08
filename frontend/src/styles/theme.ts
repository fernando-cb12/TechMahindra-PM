import { alpha, createTheme, type Components, type Theme } from "@mui/material/styles";

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
  h2: { fontSize: 28, fontWeight: 800, lineHeight: 1.15 },
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

const pillRadius = 999;

const components: Components<Theme> = {
  MuiTypography: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&[data-page-title="true"]': {
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.h2.fontSize,
          fontWeight: theme.typography.h2.fontWeight,
          lineHeight: theme.typography.h2.lineHeight,
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main,
        },
      }),
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: pillRadius,
        borderWidth: 1,
        fontFamily: theme.typography.fontFamily,
        fontWeight: 700,
        textTransform: 'none',
        transition: theme.transitions.create(
          ['background-color', 'border-color', 'box-shadow', 'color', 'transform'],
          { duration: theme.transitions.duration.shorter }
        ),
        '& .MuiButton-startIcon': {
          marginRight: theme.spacing(0.75),
          marginLeft: 0,
        },
        '& .MuiButton-endIcon': {
          marginLeft: theme.spacing(0.75),
          marginRight: 0,
        },
        '&:hover': {
          boxShadow: 'none',
        },
        '&.Mui-active, &[aria-pressed="true"]': {
          boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.28)}`,
        },
        '&.Mui-disabled': {
          opacity: 0.58,
          borderColor: alpha(theme.palette.text.disabled, 0.34),
        },
      }),
      sizeSmall: ({ theme }) => ({
        minHeight: 32,
        padding: theme.spacing(0.55, 1.5),
        fontSize: 12.5,
        lineHeight: 1.2,
      }),
      outlined: ({ theme }) => ({
        borderWidth: 1,
        borderColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.32)
          : alpha(theme.palette.primary.main, 0.38),
        color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
        '&:hover': {
          borderWidth: 1,
          borderColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.5)
            : theme.palette.primary.main,
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.08)
            : alpha(theme.palette.primary.main, 0.08),
        },
      }),
      contained: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
        '&.Mui-disabled': {
          backgroundColor: alpha(theme.palette.primary.main, 0.35),
          color: alpha(theme.palette.primary.contrastText, 0.85),
        },
      }),
      text: ({ theme }) => ({
        color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.08)
            : alpha(theme.palette.primary.main, 0.08),
        },
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: pillRadius,
        borderWidth: 1,
        fontFamily: theme.typography.fontFamily,
        fontWeight: 700,
        transition: theme.transitions.create(['background-color', 'border-color', 'color'], {
          duration: theme.transitions.duration.shorter,
        }),
      }),
      sizeSmall: ({ theme }) => ({
        height: 24,
        fontSize: 11,
        lineHeight: 1.2,
        '& .MuiChip-label': {
          paddingLeft: theme.spacing(1),
          paddingRight: theme.spacing(1),
        },
        '& .MuiChip-iconSmall': {
          marginLeft: theme.spacing(0.75),
          marginRight: theme.spacing(-0.25),
        },
        '& .MuiChip-deleteIconSmall': {
          marginLeft: theme.spacing(-0.25),
          marginRight: theme.spacing(0.6),
        },
      }),
      outlined: ({ theme }) => ({
        borderWidth: 1,
        borderColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.common.white, 0.32)
          : alpha(theme.palette.primary.main, 0.32),
      }),
      clickable: ({ theme }) => ({
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.08)
            : alpha(theme.palette.primary.main, 0.08),
        },
      }),
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: pillRadius,
        borderWidth: 1,
        fontFamily: theme.typography.fontFamily,
        fontWeight: 800,
        textTransform: 'none',
        transition: theme.transitions.create(['background-color', 'border-color', 'color'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&.Mui-selected': {
          color: theme.palette.primary.contrastText,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
        '&.Mui-disabled': {
          opacity: 0.58,
        },
      }),
      sizeSmall: ({ theme }) => ({
        minHeight: 32,
        padding: theme.spacing(0.55, 1.5),
        fontSize: 12.5,
        lineHeight: 1.2,
      }),
    },
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

  components,
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

  components,
});

export const priorityColors = {
  High: '#FE9B9C',
  Medium: '#BD9A5D',
  Low: '#B9F03D',
};

export const statusColors = {
  ToDo: '#347D39',
  InProgress: '#966600',
  QA: '#C93C37',
  Done: '#8256D0',
};
