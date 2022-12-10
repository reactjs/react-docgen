# @react-docgen/cli

## 1.0.0-alpha.1

### Major Changes

- 3b28f6e: Introducing the new CLI package `@react-docgen/cli` which was extracted from `react-docgen` and is a complete rewrite.
  Compared to the old CLI these are some of the major differences:

  - Does not support input via stdin anymore
  - The path argument is now a glob
  - `-x, --extension` was removed in favor of globs
  - `-e, --exclude` was removed
  - `-i, --ignore` now accepts a glob
  - `--handler` added
  - `--importer` added
  - `--failOnWarning` added

  Check out https://react-docgen.dev/cli for the documentation.

### Patch Changes

- Updated dependencies [3b28f6e]
  - react-docgen@6.0.0-alpha.4
