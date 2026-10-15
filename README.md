# Chronometer

Highly customizable date and time display with background images

[Official Collection on Unsplash](https://unsplash.com/collections/fYpR_W_NzKA/chronometer)

## Formatting

Use pnpm, with the version specified in `package.json`. `devEngines.runtime` declares
Node.js 24 for project tools. Run `pnpm install` to install dependencies and resolve
the managed runtime, and commit the resulting lockfile changes. Run project tools
through pnpm; `pnpm exec node --version` reports the project runtime.

Prettier uses its defaults,
configured by the `"prettier": {}` field in `package.json`.

After installing dependencies with `pnpm install`, run:

```sh
pnpm format
pnpm format:check
```

`format` rewrites supported files; `format:check` checks formatting without changing
files. `.prettierignore` excludes the generated pnpm lockfile. Configure your editor
to use the project's installed Prettier for format-on-save.
