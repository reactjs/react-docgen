---
'react-docgen': minor
---

Support `PropsWithoutRef`, `PropsWithRef` and `PropsWithChildren` in TypeScript.

Component props are now detected correctly when these builtin types are used,
but they do currently not add any props to the documentation.
