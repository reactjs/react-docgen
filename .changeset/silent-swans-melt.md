---
'react-docgen': major
---

The main `parse` API had some breaking changes.

- The arguments were changed from previously 5 to just 2. The following diff
  illustrates how to migrate:

  ```diff
  -parse(src, resolver, handlers, importer, options: { filename, ...babelOptions})
  +parse(src, { resolver, handlers, importer, filename, babelOptions: {} })
  ```

- The return type is now always an array, independent of the resolver, even if
  only one component was found in the file.
