import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        keycloakify({
            themeName: "customer-requests",
            accountThemeImplementation: "none"
        })
    ],
    // The portal SPA owns 5173; pinning this one keeps both dev servers
    // runnable side by side.
    server: {
        port: 5174
    }
});
