---
'react-docgen': minor
---

Support generic types on `React.forwardRef` calls.

Example:

`react-docgen` will now find `IButtonProps`.

```ts
export const FullWidthButton = forwardRef<HTMLButtonElement, IButtonProps>(() => {});
```
