# Release Notes

## 1.0.0-rc.6

### Patch Changes

- [#792](https://github.com/reactjs/react-docgen/pull/792)
  [`e0999e1`](https://github.com/reactjs/react-docgen/commit/e0999e155fed3b4b2915a26599f475d0884196ca)
  Thanks [@renovate](https://github.com/apps/renovate)! - update dependency
  slash to v5.1.0

- Updated dependencies
  [[`7c99f15`](https://github.com/reactjs/react-docgen/commit/7c99f156b1cc49da8bc78ca9c7e3bb2da215c49d)]:
  - react-docgen@6.0.0-rc.9

## 1.0.0-rc.5

### Patch Changes

- Updated dependencies
  [[`5a226ac`](https://github.com/reactjs/react-docgen/commit/5a226ac97882378790291cb67b1c0eee471f9def)]:
  - react-docgen@6.0.0-rc.8

## 1.0.0-rc.4

### Patch Changes

- [#782](https://github.com/reactjs/react-docgen/pull/782)
  [`72ac984`](https://github.com/reactjs/react-docgen/commit/72ac9841f02f1f6b925247621bc5aa56d3ba4267)
  Thanks [@renovate](https://github.com/apps/renovate)! - Update dependency
  commander to v10.0.1

- [#783](https://github.com/reactjs/react-docgen/pull/783)
  [`fc8a97c`](https://github.com/reactjs/react-docgen/commit/fc8a97c5fb552f5e4d2cbffced6c66f8729d23b6)
  Thanks [@renovate](https://github.com/apps/renovate)! - update dependency
  slash to v5.0.1

- Updated dependencies
  [[`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca),
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca),
  [`a684d82`](https://github.com/reactjs/react-docgen/commit/a684d8281044b3f8c8baecc9148cd4ef2b8fd409),
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca),
  [`e08e08d`](https://github.com/reactjs/react-docgen/commit/e08e08d6cd56c833fd123019639dca9d819cd7ab)]:
  - react-docgen@6.0.0-rc.7

## 1.0.0-beta.3

### Minor Changes

- 217a005: Add support for the `FindAnnotatedDefinitionsResolver`.

  Can be used with

  ```
  react-docgen --resolver find-all-annotated-components
  ```

### Patch Changes

- Updated dependencies [dfc2f85]
- Updated dependencies [cc94da2]
- Updated dependencies [98a1138]
  - react-docgen@6.0.0-beta.6

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

  Check out https://react-docgen.dev/docs/getting-started/cli/ for the
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
