---
'react-docgen': major
---

Improve performance of file system importer.

The file system importer now also caches the resolving of files in addition to
parsing files. If the importer is used in an environment where files do change
at runtime (like a watch command) then the caches will need to be cleared on
every file change.
