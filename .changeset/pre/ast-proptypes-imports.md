---
'@react-docgen/core': patch
---

Recognize PropTypes imports from the parsed AST instead of scanning source text
with a potentially slow regular expression. Comments and string literals no
longer count as module imports.
