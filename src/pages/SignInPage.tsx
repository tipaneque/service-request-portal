import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Button, Paper, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "@/auth/AuthContext";
import { Alert } from "@/components/Alert";
import { Spinner } from "@/components/Spinner";
import { IMAGES } from "@/lib/assets";

interface LocationState {
  from?: { pathname?: string; search?: string };
}

/** Starts authentication immediately; there is no redundant sign-in button. */
export function SignInPage() {
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const location = useLocation();
  const startedRef = useRef(false);
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

  useEffect(() => {
    if (isAuthenticated || isLoading || error || startedRef.current) return;
    startedRef.current = true;
    void beginSignIn();
  }, [beginSignIn, error, isAuthenticated, isLoading]);

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

        {failure ? (
          <Alert
            tone="error"
            title="Sign-in failed"
            actions={
              <Button
                type="button"
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  startedRef.current = true;
                  void beginSignIn();
                }}
              >
                Try again
              </Button>
            }
          >
            <p>{failure.message}</p>
          </Alert>
        ) : (
          <Box role="status" aria-live="polite">
            <Spinner size="large" label={null} />
            <Typography component="h1" variant="h4" sx={{ mt: 2, mb: 0.5 }}>
              Redirecting to sign-in
            </Typography>
            <Typography color="text.secondary">
              Preparing your organisation authentication…
            </Typography>
          </Box>
        )}
      </Paper>
    </main>
  );
}
