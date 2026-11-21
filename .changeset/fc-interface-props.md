---
'react-docgen': patch
---

Resolve component props that are only defined through a React function
component type annotation, e.g. `interface Props {...}` used in
`const MyComponent: React.FC<Props> = () => ...` (issue #387). This now works
both for TypeScript-parsed and Flow-parsed sources, for the deprecated
`React.SFC`/`React.StatelessComponent` aliases, when a named function is
assigned to an annotated variable (`const C: React.FC<Props> = Inner`), and
for props expressed only via the generic argument of `React.memo<Props>(...)`.
Flow `React.PropsWithChildren`/`PropsWithRef`/`PropsWithoutRef` wrappers are
now unwrapped as well.
