import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { Spinner } from "@/components/Spinner";
import { IMAGES } from "@/lib/assets";

const INDICATOR_DELAY_MS = 350;

/**
 * Keeps the first authentication frames visually stable. Quick redirects do
 * not flash a card on screen, while slower provider checks still get feedback.
 */
export function AuthTransition() {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIndicator(true), INDICATOR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="signin" aria-busy="true">
      {showIndicator ? (
        <Paper
          className="signin__card"
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "24rem",
            p: { xs: 3, sm: 4 },
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src={IMAGES.logo}
            alt=""
            sx={{ width: 64, height: 64, objectFit: "contain", mb: 2 }}
          />
          <Box role="status" aria-live="polite">
            <Spinner size="large" label={null} />
            <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 0.5 }}>
              Connecting to sign-in
            </Typography>
            <Typography color="text.secondary">
              Preparing your organisation authentication&hellip;
            </Typography>
          </Box>
        </Paper>
      ) : (
        <span className="visually-hidden" role="status">
          Connecting to sign-in&hellip;
        </span>
      )}
    </main>
  );
}
