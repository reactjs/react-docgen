---
'react-docgen': minor
---

Extract props from the TypeScript `Pick<T, K>` and `Omit<T, K>` utility types
when the keys are string or number literals, including in type aliases,
intersections and interface `extends`.
