---
'@react-docgen/core': patch
---

Document methods wrapped in React `useCallback` and exposed through
`useImperativeHandle`, preserving their parameters, return types, descriptions,
and async/generator modifiers across parser adapters.

Ported from [#1139](https://github.com/reactjs/react-docgen/pull/1139) by
[@askalf](https://github.com/askalf).
