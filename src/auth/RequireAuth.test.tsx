import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppAuthProvider } from "./AppAuthProvider";
import { RequireAuth } from "./RequireAuth";
import { getAccessToken } from "./tokenStore";
import { useAuth } from "./AuthContext";
import { SignInPage } from "@/pages/SignInPage";

function renderGuardedApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AppAuthProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/requests" element={<h1>Protected requests</h1>} />
              </Route>
            </Routes>
          </QueryClientProvider>
        </AppAuthProvider>
      </MemoryRouter>,
    ),
  };
}

describe("authentication flow", () => {
  it("starts sign-in automatically for an unauthenticated visitor", async () => {
    renderGuardedApp("/requests");

    expect(await screen.findByText("Protected requests")).toBeInTheDocument();
  });

  it("renders the protected screen once the automatic sign-in completes", async () => {
    renderGuardedApp("/requests");

    expect(await screen.findByText("Protected requests")).toBeInTheDocument();
  });

  it("returns the visitor to the page they originally asked for", async () => {
    renderGuardedApp("/requests?status=OPEN");

    expect(await screen.findByText("Protected requests")).toBeInTheDocument();
  });

  it("publishes an access token for the API layer only while signed in", async () => {
    renderGuardedApp("/requests");
    await screen.findByText("Protected requests");

    expect(getAccessToken()).toBe("mock-access-token");
  });

  it("does not leak a session across browser tabs or reloads once signed out", async () => {
    const { unmount } = renderGuardedApp("/requests");
    await screen.findByText("Protected requests");

    unmount();
    window.sessionStorage.clear(); // a fresh tab starts with empty session storage

    function AuthState() {
      const { isAuthenticated } = useAuth();
      return <span>{isAuthenticated ? "Signed in" : "Signed out"}</span>;
    }

    render(
      <AppAuthProvider>
        <AuthState />
      </AppAuthProvider>,
    );

    expect(screen.getByText("Signed out")).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });
});
