# @react-docgen/typescript

## 1.0.0-alpha.0

### Major Changes

- [#1158](https://github.com/reactjs/react-docgen/pull/1158)
  [`b4985cb`](https://github.com/reactjs/react-docgen/commit/b4985cb0359cc8625303f262b958a49602d9960e)
  Thanks [@danez](https://github.com/danez)! - Target 1.0.0 for the initial
  release of the parser-neutral core and parser adapters.

### Patch Changes

- [#1156](https://github.com/reactjs/react-docgen/pull/1156)
  [`c96cc79`](https://github.com/reactjs/react-docgen/commit/c96cc79c45591f1e53b38f2f82a1ccce61e26c6c)
  Thanks [@danez](https://github.com/danez)! - Extract TypeScript props from
  React class components extending mixin calls, including aliased component
  bases and wrapped props. Preserve declared props when a mixin receives
  unrelated generic arguments.

  Ported from [#1145](https://github.com/reactjs/react-docgen/pull/1145) by
  [@mfazekas](https://github.com/mfazekas), merged with follow-up fixes in
  [#1157](https://github.com/reactjs/react-docgen/pull/1157). Shared regression
  fixtures cover the legacy parser, TypeScript adapter, and TypeScript handlers
  composed with the normalized Babel adapter.

- Updated dependencies
  [[`6d5e108`](https://github.com/reactjs/react-docgen/commit/6d5e108ef70fd6a740c3308031ec81137589e778),
  [`b4985cb`](https://github.com/reactjs/react-docgen/commit/b4985cb0359cc8625303f262b958a49602d9960e),
  [`6227063`](https://github.com/reactjs/react-docgen/commit/6227063bd29bd30a9fd3bac72e545e9512a29d6c)]:
  - @react-docgen/core@1.0.0-alpha.0
