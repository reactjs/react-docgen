---
'react-docgen': minor
---

Added a new resolver that finds annotated components. This resolver is also
enabled by default.

To use this feature simply annotated a component with `@component`.

```ts
// @component
class MyComponent {}
```
