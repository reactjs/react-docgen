---
'react-docgen': major
---

Main `parse` API was changed

The main API changed and now includes only 2 arguments.

```diff
-parse(src, resolver, handlers, importer, options)
+parse(src, { resolver, handlers, importers, ... })
```
