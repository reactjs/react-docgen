---
'react-docgen': major
---

Renamed and migrated built-in resolvers to classes.

- `findAllComponentDefinitions` was renamed to `FindAllDefinitionsResolver` and
  is now a class.

  ```diff
  -const resolver = builtinResolvers.findAllComponentDefinitions
  +const resolver = new builtinResolvers.FindAllDefinitionsResolver()
  ```

- `findAllExportedComponentDefinitions` was renamed to
  `FindExportedDefinitionsResolver` and is now a class.

  ```diff
  -const resolver = builtinResolvers.findAllExportedComponentDefinitions
  +const resolver = new builtinResolvers.FindExportedDefinitionsResolver()
  ```

- `findExportedComponentDefinition` was removed.
  Use`FindExportedDefinitionsResolver` with the `limit` option instead.

  > This is still the default resolver.

  ```diff
  -const resolver = builtinResolvers.findExportedComponentDefinition
  +const resolver = new builtinResolvers.FindExportedDefinitionsResolver({ limit: 1 })
  ```
