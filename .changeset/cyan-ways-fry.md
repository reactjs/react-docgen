---
'react-docgen': major
---

`getTypeFromReactComponent` now returns an array of paths to types instead of
just one. This can appear when multiple type definitions are found for a
component, for example:

```ts
const Component: React.FC<Props> = (props: { some: string }) => {};
```

In this example both the `Props` definition as well as `{ some: string }` are
now found and used.

Here is a simple diff to illustrate the change when using
`getTypeFromReactComponent`:

```diff

const type = getTypeFromReactComponent(path)

-if (type) {
+if (type.length > 0) {
    // do smth
}

```
