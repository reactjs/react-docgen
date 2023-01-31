# @react-docgen/cli

## 1.0.0-beta.2

### Major Changes

- 80e4c74: Renamed `--handlers` option to `--handler`. This unifies all options
  to be singular.

### Minor Changes

- 80e4c74: `--resolver` option can now be used multiple times.

  If used multiple times the resolvers will be chained in the defined order and
  all components from all resolvers will be used.

### Patch Changes

- ebd9130: Display the correct help info when running `react-docgen --help`
- 050313d: Correctly add LICENSE file to published packages
- 5b281f4: update dependency commander to v10
- Updated dependencies [8fe3dbf]
- Updated dependencies [d7a39af]
- Updated dependencies [80e4c74]
- Updated dependencies [e956802]
- Updated dependencies [80e4c74]
- Updated dependencies [ea25b16]
- Updated dependencies [1aa0249]
- Updated dependencies [050313d]
- Updated dependencies [5215bab]
- Updated dependencies [f6e4fe7]
- Updated dependencies [5215bab]
- Updated dependencies [80e4c74]
  - react-docgen@6.0.0-beta.5

## 1.0.0-alpha.1

### Major Changes

- 3b28f6e: Introducing the new CLI package `@react-docgen/cli` which was
  extracted from `react-docgen` and is a complete rewrite. Compared to the old
  CLI these are some of the major differences:

  - Does not support input via stdin anymore
  - The path argument is now a glob
  - `-x, --extension` was removed in favor of globs
  - `-e, --exclude` was removed
  - `-i, --ignore` now accepts a glob
  - `--handler` added
  - `--importer` added
  - `--failOnWarning` added

  Check out https://react-docgen.dev/docs/getting-started/cli for the
  documentation.

### Patch Changes

- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [caae6bf]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [3b28f6e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [96d6e9e]
- Updated dependencies [d4c27d4]
- Updated dependencies [96d6e9e]
  - react-docgen@6.0.0-alpha.4
