import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import { Box, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { App } from "./App";
import { Alert } from "./components/Alert";
import { startMockWorker } from "./mocks/startWorker";
import { PortalThemeProvider } from "./styles/muiTheme";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root was not found in index.html");
}
const rootContainer = container;

// The mock worker must be listening before the first request is issued,
// otherwise the initial list call escapes to the network.
function renderApp(): void {
  createRoot(rootContainer).render(
    <StrictMode>
      <PortalThemeProvider>
        <App />
      </PortalThemeProvider>
    </StrictMode>,
  );
}

void startMockWorker().then(renderApp, (error: unknown) => {
  console.error("Could not start the mock API", error);
  const message =
    error instanceof Error ? error.message : "Unknown startup error";
  createRoot(rootContainer).render(
    <PortalThemeProvider>
      <Box className="app-main" component="main" sx={{ pt: 8 }}>
        <Alert
          tone="error"
          title="The local API could not be started"
          actions={
            <Button
              type="button"
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Reload the portal
            </Button>
          }
        >
          <p>
            Reload the page. If the problem continues, verify that the service
            worker is available at the configured base path.
          </p>
          <p className="alert__trace">{message}</p>
        </Alert>
      </Box>
    </PortalThemeProvider>,
  );
});
