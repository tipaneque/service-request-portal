import { useCallback, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Button, Paper, Typography } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "@/auth/AuthContext";
import { Alert } from "@/components/Alert";
import { IMAGES } from "@/lib/assets";

interface LocationState {
  from?: { pathname?: string; search?: string };
}

/** Entry screen that lets the visitor explicitly continue to the OIDC provider. */
export function SignInPage() {
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const location = useLocation();
  const [redirectError, setRedirectError] = useState<Error | null>(null);

  const state = location.state as LocationState | null;
  const returnTo = state?.from
    ? `${state.from.pathname ?? "/requests"}${state.from.search ?? ""}`
    : "/requests";

  const beginSignIn = useCallback(async () => {
    setRedirectError(null);
    try {
      await signIn(returnTo);
    } catch (cause) {
      setRedirectError(
        cause instanceof Error ? cause : new Error("Sign-in failed."),
      );
    }
  }, [returnTo, signIn]);

  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  const failure = error ?? redirectError;

  return (
    <main className="signin">
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

        <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
          Customer Requests Manager
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Use your organisation account to access the service request portal.
        </Typography>

        {failure && (
          <Box sx={{ mb: 2, textAlign: "left" }}>
            <Alert tone="error" title="Sign-in could not be started">
              <p>{failure.message}</p>
            </Alert>
          </Box>
        )}

        <Button
          type="button"
          variant="contained"
          size="large"
          fullWidth
          startIcon={<LoginIcon />}
          disabled={isLoading}
          onClick={() => void beginSignIn()}
        >
          {isLoading ? "Opening sign-in…" : failure ? "Try again" : "Continue to sign in"}
        </Button>
      </Paper>
    </main>
  );
}
