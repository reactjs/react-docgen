---
'react-docgen': patch
---

Fix `defaultPropsHandler` dropping default values that are template literals,
both in destructured parameters and in `defaultProps`. They are now reported
with their source text as the value and `computed: false`
([#1203](https://github.com/reactjs/react-docgen/issues/1203)).
