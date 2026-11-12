---
'react-docgen': patch
---

Extract component prop documentation from the builtin TypeScript
`Readonly<Props>` wrapper without unwrapping locally declared types named
`Readonly`.
