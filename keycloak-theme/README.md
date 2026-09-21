# Customer Requests Keycloak theme

This is the standalone authentication theme for **Customer Requests Manager**,
built with Keycloakify. It is installed in Keycloak under the name
`customer-requests`.

The tokens in `src/login/theme.css` mirror the portal tokens in
`../src/styles/index.css`. Keep both files in sync when changing colours,
typography, border radii, or shadows.

## Development

```bash
npm install
npm run dev
# To preview additional states:
npm run storybook
```

The Vite server displays the `login.ftl` page. Storybook includes the default,
invalid credentials, and remembered user states.

## Validation and build

```bash
npm run lint
npm run typecheck
npm run build-keycloak-theme
```

The last command requires Java and Maven and creates the JARs in
`dist_keycloak/`.

## Installing in Keycloak

1. Copy the JAR from `dist_keycloak/` that matches your Keycloak version to
   `<KEYCLOAK_HOME>/providers/`.
2. Restart Keycloak.
3. Open **Realm settings → Themes** in the **Customer Requests Manager** realm.
4. Select `customer-requests` under **Login theme** and save the changes.

When using Docker, mount or copy the JAR to `/opt/keycloak/providers/` before
starting the server.
