# Chronometer

Highly customizable date and time display with background images

[Official Collection on Unsplash](https://unsplash.com/collections/fYpR_W_NzKA/chronometer)

## Development

Use pnpm, with the version specified in `package.json`. `devEngines.runtime` declares
Node.js 24 for project tools. Run `pnpm install` to install dependencies and resolve
the managed runtime, and commit the resulting lockfile changes. Run project tools
through pnpm; `pnpm exec node --version` reports the project runtime.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite, under `/chronometer/`. The application still
uses the production photo API during local development.

Build the site and preview the production output with:

```sh
pnpm build
pnpm preview
```

Vite writes the built site to `dist/`, which is ignored by Git. `vite.config.js`
sets the base path to `/chronometer/` for the repository's GitHub Pages URL. Update
that setting if the site moves to a custom domain or a different repository path.

`idb` is installed through pnpm and bundled by Vite. Photo history uses the
existing `chronometer-photo-history` IndexedDB database and schema version 1.

## Formatting

Prettier uses its defaults, configured by the `"prettier": {}` field in
`package.json`.

After installing dependencies with `pnpm install`, run:

```sh
pnpm format
pnpm format:check
```

`format` rewrites supported files; `format:check` checks formatting without changing
files. `.prettierignore` excludes the generated pnpm lockfile. Configure your editor
to use the project's installed Prettier for format-on-save.

## Deployment

The GitHub Actions workflow runs formatting checks and builds in parallel on
pushes, pull requests, and manual runs. The `build` job uploads `dist/` as the Pages
artifact only for `main`. After both `checks` and `build` pass, the `deploy` job
publishes that artifact only for `main`. It deploys the same output that passed
the build, without rebuilding.
