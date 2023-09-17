---
'react-docgen': major
---

`resolveToValue` will not resolve to `ImportDeclaration` anymore but instead to
one of the possible specifiers (`ImportSpecifier`, `ImportDefaultSpecifier` or
`ImportNamespaceSpecifier`). This gives better understanding to which specifier
exactly `resolveToValue` did resolve a NodePath to.

Here is a possible easy fix for this in a code snippet that uses
`resolveToValue`

```diff
const resolved = resolveToValue(path);

-if (resolved.isImportDeclaration()) {
+if (resolved.parentPath?.isImportDeclaration()) {
    // do smth
}
```
