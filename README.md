# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Frontend Module Layout (Current)

The app follows business-domain modules under `src/modules`.

- `admin`: administrator management business module.
- `login`: login business module (real business module, parallel to `admin`).
- `region`: country/region management business module.
- `user`: user master-data business module.
- `auth`: authentication/authorization domain module.
  - `auth/authentication`: token/session and route guard capabilities.
  - `auth/authorization`: role/permission matrix and checks.

Notes:

- Login page and login orchestration are owned by top-level `modules/login`.
- `modules/auth` no longer carries login page business files.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Import Conventions

- See `docs/import-conventions.md` for module-entry import rules and code review checklist.
