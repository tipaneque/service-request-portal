import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { KcPage } from "./kc.gen";

async function start() {
    if (import.meta.env.DEV) {
        const { getKcContextMock } = await import("./login/KcPageStory");

        window.kcContext = getKcContextMock({
            pageId: "login.ftl",
            overrides: {
                realm: {
                    displayName: "Customer Requests Manager",
                    // The template greets with `displayNameHtml || name`.
                    displayNameHtml: "Customer Requests Manager"
                }
            }
        });
    }

    createRoot(document.getElementById("root")!).render(
        <StrictMode>
            {!window.kcContext ? (
                <h1>Contexto do Keycloak indisponível</h1>
            ) : (
                <KcPage kcContext={window.kcContext} />
            )}
        </StrictMode>
    );
}

void start();
