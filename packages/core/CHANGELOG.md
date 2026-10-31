# @react-docgen/core

## 1.0.0-alpha.0

### Major Changes

- [#1158](https://github.com/reactjs/react-docgen/pull/1158)
  [`b4985cb`](https://github.com/reactjs/react-docgen/commit/b4985cb0359cc8625303f262b958a49602d9960e)
  Thanks [@danez](https://github.com/danez)! - Target 1.0.0 for the initial
  release of the parser-neutral core and parser adapters.

### Patch Changes

- [#1156](https://github.com/reactjs/react-docgen/pull/1156)
  [`6d5e108`](https://github.com/reactjs/react-docgen/commit/6d5e108ef70fd6a740c3308031ec81137589e778)
  Thanks [@danez](https://github.com/danez)! - Recognize PropTypes imports from
  the parsed AST instead of scanning source text with a potentially slow regular
  expression. Comments and string literals no longer count as module imports.

- [#1156](https://github.com/reactjs/react-docgen/pull/1156)
  [`6227063`](https://github.com/reactjs/react-docgen/commit/6227063bd29bd30a9fd3bac72e545e9512a29d6c)
  Thanks [@danez](https://github.com/danez)! - Document methods wrapped in React
  `useCallback` and exposed through `useImperativeHandle`, preserving their
  parameters, return types, descriptions, and async/generator modifiers across
  parser adapters.

  Ported from [#1139](https://github.com/reactjs/react-docgen/pull/1139) by
  [@askalf](https://github.com/askalf).
