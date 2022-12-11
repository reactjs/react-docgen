---
'react-docgen': minor
---

Improve performance drastically by making changes to AST traversal

Visitors are now pre-exploded and are cached in the module scope instead of creating them on every call.
This change brought the benchmark from 170ops/s to 225ops/sec
