import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { portalTheme } from "./theme";

/** Applies the single light Material UI theme to the entire application. */
export function PortalThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={portalTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
