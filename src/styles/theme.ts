import { createTheme, type Theme } from "@mui/material";
import { IMAGES } from "@/lib/assets";

/**
 * Liquid-glass design tokens.
 *
 * The application has one light theme. The MUI theme republishes these values
 * as CSS custom properties so the layout-only rules in `index.css` stay in
 * sync without a second token system.
 */
const tokens = {
  canvas: "#ffffff",
  glass: "rgba(255, 255, 255, 0.70)",
  glassStrong: "rgba(255, 255, 255, 0.85)",
  glassSoft: "rgba(255, 255, 255, 0.45)",
  glassBorder: "rgba(255, 255, 255, 0.85)",
  hairline: "rgba(15, 23, 42, 0.10)",
  shadow: "0 18px 40px -18px rgba(15, 23, 42, 0.35)",
  shadowLifted: "0 28px 60px -20px rgba(15, 23, 42, 0.45)",
  /* Flat wash laid over the sign-in wallpaper: one opacity, not a ramp. */
  scrim: "rgba(238, 241, 251, 0.42)",
  text: "#161b33",
  textMuted: "#5a6484",
  primary: "#5b56e0",
  primaryHover: "#4a45d1",
  secondary: "#0891b2",
  error: "#ff0000",
  success: "#04C71B",
  warning: "#d97706",
  info: "#2563eb",
} as const;

/** Status and priority hues used by badges and table metadata. */
const semantic = {
  OPEN: "#2563eb",
  IN_PROGRESS: "#b45309",
  RESOLVED: "#047857",
  CLOSED: "#475569",
  LOW: "#475569",
  MEDIUM: "#0e7490",
  HIGH: "#BF2424",
  CRITICAL: "#ff0000",
} as const;

const BLUR = "blur(22px) saturate(180%)";

type Tokens = typeof tokens;

/** The recipe every floating pane shares: translucency, blur and a lit edge. */
function glassSurface(t: Tokens) {
  return {
    backgroundColor: t.glass,
    backgroundImage: "none",
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
    border: `1px solid ${t.glassBorder}`,
    boxShadow: t.shadow,
  } as const;
}

const t = tokens;
const s = semantic;
const ease = "cubic-bezier(0.32, 0.72, 0, 1)";

export const portalTheme: Theme = createTheme({
  shape: { borderRadius: 16 },
  palette: {
    mode: "light",
    primary: { main: t.primary, contrastText: "#ffffff" },
    secondary: { main: t.secondary, contrastText: "#ffffff" },
    error: { main: t.error },
    success: { main: t.success },
    warning: { main: t.warning },
    info: { main: t.info },
    background: { default: t.canvas, paper: t.glass },
    text: { primary: t.text, secondary: t.textMuted },
    divider: t.hairline,
  },
  typography: {
    fontFamily: '"Manrope Variable", Manrope, system-ui, sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.15,
    },
    h2: {
      fontSize: "1.65rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "1.4rem",
      fontWeight: 650,
      letterSpacing: "-0.022em",
      lineHeight: 1.22,
    },
    h4: { fontSize: "1.2rem", fontWeight: 650, letterSpacing: "-0.018em" },
    h5: { fontWeight: 650, letterSpacing: "-0.012em" },
    h6: { fontWeight: 650, letterSpacing: "-0.008em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      letterSpacing: "0.005em",
      textTransform: "none",
    },
  },
  transitions: {
    duration: { shortest: 120, shorter: 160, short: 220, standard: 280 },
    easing: { easeInOut: ease },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Republished for the layout-only rules in `index.css`.
        ":root": {
          colorScheme: "light",
          "--canvas": t.canvas,
          "--glass": t.glass,
          "--glass-strong": t.glassStrong,
          "--glass-soft": t.glassSoft,
          "--glass-border": t.glassBorder,
          "--hairline": t.hairline,
          "--shadow": t.shadow,
          "--shadow-lifted": t.shadowLifted,
          "--scrim": t.scrim,
          // Built from BASE_URL so a sub-path deployment still resolves it.
          "--login-wallpaper": `url(${IMAGES.loginWallpaper})`,
          "--blur": BLUR,
          "--text": t.text,
          "--text-muted": t.textMuted,
          "--accent": t.primary,
          "--accent-hover": t.primaryHover,
          "--accent-2": t.secondary,
          "--accent-contrast": "#ffffff",
          "--danger": t.error,
          "--success": t.success,
          "--status-OPEN": s.OPEN,
          "--status-IN_PROGRESS": s.IN_PROGRESS,
          "--status-RESOLVED": s.RESOLVED,
          "--status-CLOSED": s.CLOSED,
          "--priority-LOW": s.LOW,
          "--priority-MEDIUM": s.MEDIUM,
          "--priority-HIGH": s.HIGH,
          "--priority-CRITICAL": s.CRITICAL,
        },
        "*::selection": { backgroundColor: t.primary, color: "#ffffff" },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          ...glassSurface(t),
          borderRadius: 20,
          color: t.text,
          transition: `box-shadow 280ms ${ease}, transform 280ms ${ease}`,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          backgroundImage: "none",
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          borderRadius: 0,
          border: "none",
          borderBottom: `1px solid ${t.hairline}`,
          boxShadow: "none",
          color: t.text,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 999,
          paddingInline: 18,
          transition: `transform 220ms ${ease}, box-shadow 220ms, background-color 220ms, border-color 220ms`,
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(0)" },
          "&.Mui-focusVisible": {
            outline: `2px solid ${t.primary}`,
            outlineOffset: 2,
          },
        },
        contained: {
          backgroundImage: "none",
          backgroundColor: t.primary,
          boxShadow: `0 10px 24px -12px ${t.primary}`,
          "&:hover": {
            backgroundColor: t.primaryHover,
            boxShadow: `0 16px 30px -12px ${t.primary}`,
          },
          // A full-strength accent on a button that does nothing reads as an
          // error rather than as unavailable.
          "&.Mui-disabled": {
            backgroundColor: t.glassStrong,
            color: t.textMuted,
            boxShadow: "none",
          },
        },
        outlined: {
          backgroundColor: t.glassSoft,
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          borderColor: t.glassBorder,
          color: t.text,
          "&:hover": { borderColor: t.primary, backgroundColor: t.glass },
        },
        text: {
          color: t.primary,
          "&:hover": {
            backgroundColor: "rgba(91,86,224,0.08)",
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          color: t.text,
          transition: `background-color 220ms, transform 220ms ${ease}`,
          "&:hover": {
            backgroundColor: t.glassStrong,
            transform: "translateY(-1px)",
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: t.glassSoft,
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          transition: "background-color 220ms, box-shadow 220ms",
          "& fieldset": {
            borderColor: t.hairline,
            transition: "border-color 220ms",
          },
          "&:hover fieldset": {
            borderColor: "rgba(15,23,42,0.22)",
          },
          /*
           * A focused field keeps no border, by design. The surface lift
           * alone is not a focus indicator though - measured, it is only
           * 1.01:1 against the idle state, where WCAG 1.4.11 asks for 3:1 -
           * so the accent is drawn *inside* the field instead. It reads as a
           * ring rather than an outline and clears the threshold comfortably.
           */
          "&.Mui-focused": {
            backgroundColor: t.glassStrong,
            boxShadow: `inset 0 0 0 2px ${t.primary}`,
          },
          "&.Mui-focused fieldset": { border: "none" },
          "&:hover.Mui-focused fieldset": { border: "none" },
          "&.Mui-error fieldset": { borderColor: t.error },
          "&.Mui-error.Mui-focused": {
            boxShadow: `inset 0 0 0 2px ${t.error}`,
          },
          "&.Mui-error.Mui-focused fieldset": { border: "none" },
        },
        // A native `<select>` popup inherits the page background otherwise,
        // which is unreadable against a translucent field.
        input: {
          "& option": { backgroundColor: "#ffffff", color: t.text },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { color: t.textMuted, "&.Mui-focused": { color: t.primary } },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 2, marginTop: 6, color: t.textMuted },
      },
    },

    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderRadius: 18,
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          boxShadow: t.shadow,
          alignItems: "flex-start",
        },
        colorError: {
          backgroundColor: "rgba(220,38,38,0.07)",
        },
        colorSuccess: {
          backgroundColor: "rgba(5,150,105,0.07)",
        },
        colorWarning: {
          backgroundColor: "rgba(217,119,6,0.07)",
        },
        colorInfo: {
          backgroundColor: "rgba(37,99,235,0.07)",
        },
        message: { width: "100%" },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          backgroundColor: t.glassStrong,
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          border: `1px solid ${t.hairline}`,
        },
        label: { paddingInline: 12 },
        deleteIcon: { color: t.textMuted, "&:hover": { color: t.error } },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: "none",
          boxShadow: "none",
          backgroundColor: "transparent",
          backgroundImage: "none",
          backdropFilter: "none",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: "separate", borderSpacing: 0 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${t.hairline}`, color: t.text },
        head: {
          backgroundColor: "transparent",
          color: t.textMuted,
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 200ms",
          "&:hover": { backgroundColor: t.glassSoft },
          "&:last-of-type td": { borderBottom: "none" },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(22,27,51,0.92)",
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          borderRadius: 10,
          fontSize: "0.75rem",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backgroundImage: "none",
          backdropFilter: BLUR,
          WebkitBackdropFilter: BLUR,
          borderRadius: 0,
          border: "none",
          borderRight: `1px solid ${t.hairline}`,
        },
      },
    },

    MuiMenu: { styleOverrides: { paper: { borderRadius: 16, marginTop: 6 } } },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: { color: t.primary, fontWeight: 600, textUnderlineOffset: 3 },
      },
    },
    MuiCircularProgress: { styleOverrides: { root: { color: t.primary } } },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: {
        root: { backgroundColor: t.glassSoft, borderRadius: 12 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: t.glassStrong,
          color: t.text,
          fontWeight: 700,
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: t.hairline } } },
  },
});
