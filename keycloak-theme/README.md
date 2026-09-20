# Customer Requests Keycloak theme

Pacote independente do tema de autenticação do **Customer Requests Manager**, construído com Keycloakify. O nome instalado no Keycloak é `customer-requests`.

Os tokens em `src/login/theme.css` espelham os tokens do portal em `../src/styles/index.css`. Ao alterar cores, tipografia, raios ou sombras, mantenha os dois ficheiros sincronizados.

## Desenvolvimento

```bash
npm install
npm run dev
# ou, para testar estados diferentes:
npm run storybook
```

O servidor Vite mostra a página `login.ftl`. O Storybook inclui estados normal, credenciais inválidas e utilizador lembrado.

## Validação e build

```bash
npm run lint
npm run typecheck
npm run build-keycloak-theme
```

O último comando requer Java e Maven e cria os JARs em `dist_keycloak/`.

## Instalação no Keycloak

1. Copie para `<KEYCLOAK_HOME>/providers/` o JAR de `dist_keycloak/` compatível com a sua versão do Keycloak.
2. Reinicie o Keycloak.
3. No realm **Customer Requests Manager**, abra **Realm settings → Themes**.
4. Seleccione `customer-requests` em **Login theme** e grave.

Em Docker, monte ou copie o JAR para `/opt/keycloak/providers/` antes de iniciar o servidor.
