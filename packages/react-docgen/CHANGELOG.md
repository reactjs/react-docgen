# Release Notes

## 6.0.0-beta.6

### Major Changes

- dfc2f85: Rename `propDocBlockHandler` to `propDocblockHandler` for consistency

### Patch Changes

- cc94da2: Fix using react-docgen in browsers
- 98a1138: Add `displayName` and `description` to Documentation type

## 6.0.0-beta.5

### Major Changes

- d7a39af: Refactored `resolveComponentDefinition` utility.

  - Renamed to `findComponentDefinition`
  - Removed named export `isComponentDefinition`
  - The utility now does a lot more than previously, check out the commit to see
    the changes in detail.

- e956802: Remove match utility.

  The utility can be replaced by babel helpers and is not needed anymore. Also
  using explicit checks like `path.isMemberExpression()` is better for type
  safety and catching potential bugs.

- 5215bab: Removed support for the `@extends React.Component` annotation on
  react class components.

  Instead you can use the new `@component` annotation.

- 80e4c74: Renamed and migrated built-in resolvers to classes.

  - `findAllComponentDefinitions` was renamed to `FindAllDefinitionsResolver`
    and is now a class.

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

  - `findExportedComponentDefinition` was removed. Use
    `FindExportedDefinitionsResolver` with the `limit` option instead.

    > This is still the default resolver.

    ```diff
    -const resolver = builtinResolvers.findExportedComponentDefinition
    +const resolver = new builtinResolvers.FindExportedDefinitionsResolver({ limit: 1 })
    ```

### Minor Changes

- 80e4c74: Add the new ChainResolver which allows multiple resolvers to be
  chained.

  ```ts
  import { builtinResolvers } from 'react-docgen';

  const { ChainResolver } = builtinResolvers;
  const resolver = new ChainResolver([resolver1, resolver2], {
    chainingLogic: ChainResolver.Logic.ALL, // or ChainResolver.Logic.FIRST_FOUND,
  });
  ```

- 80e4c74: Allow resolvers to be classes in addition to functions.

  ```ts
  import type { ResolverClass, ResolverFunction } from 'react-docgen';

  // This was the only option until now
  const functionResolver: ResolverFunction = (file: FileState) => {
    //needs to return array of found components
  };

  // This is the new class resolver
  class MyResolver implements ResolverClass {
    resolve(file: FileState) {
      //needs to return array of found components
    }
  }

  const classResolver = new MyResolver();
  ```

- 5215bab: Added a new resolver that finds annotated components. This resolver
  is also enabled by default.

  To use this feature simply annotated a component with `@component`.

  ```ts
  // @component
  class MyComponent {}
  ```

### Patch Changes

- 8fe3dbf: Fix crash when using TypeScript mapped types
- ea25b16: Handle cyclic references in PropTypes `shape()` and `exact()`
  methods.
- 1aa0249: Handle `typeof import('...')` and `typeof MyType.property` correctly
  in TypeScript
- 050313d: Correctly add LICENSE file to published packages
- f6e4fe7: Update dependency strip-indent to v4

## 6.0.0-alpha.4

### Major Changes

- 96d6e9e: Rename `flowTypeHandler` to `codeTypeHandler` because it handles Flow
  and TypeScript
- 96d6e9e: Simplify `resolveObjectValuesToArray` and remove type handling. None
  of the code that was handling types was actually used.
- caae6bf: The return values of `resolveObjectValuesToArray` are now in the
  order they are defined in the source code.
- 96d6e9e: Migrate react-docgen to ES modules. Please read
  [this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
- 3b28f6e: The CLI was removed from `react-docgen` into its own package
  `@react-docgen/cli`.

  Check out https://react-docgen.dev/cli for the documentation.

- 96d6e9e: Main `parse` API was changed

  The main API changed and now includes only 2 arguments.

  ```diff
  -parse(src, resolver, handlers, importer, options)
  +parse(src, { resolver, handlers, importer, ... })
  ```

- 96d6e9e: Renamed some of the main exports for clarity.

  Renamed `handlers` to `builtinHandlers` Renamed `resolver` to
  `builtinResolvers` Renamed `importers` to `builtinImporters`

- 96d6e9e: Migrated to babel toolchain

  This is one of the big changes in this new version of react-docgen. It made
  the code a lot more robust because there are now finally working TypeScript
  types for the ASTs.

  Another benefit from this change that react-docgen is now a lot faster. 🚀 In
  some tests an improvement of nearly 50% was seen in comparison to version 5.

- d4c27d4: Improve performance of file system importer.

  The file system importer now also caches resolving of files in addition to
  parsing files. If the importer is used in an environment where files do change
  at runtime (like a watch command) then the caches will need to be cleared on
  every file change.

- 96d6e9e: Changed the minimum Node.js version to 14.18.0

### Minor Changes

- 96d6e9e: Add support for `.cts` and `.mts` extension when using typescript
- 96d6e9e: Treat functions returning `React.Children.map` as components
- 96d6e9e: Improve performance by creating all visitors only once
- 96d6e9e: Support all possible kinds of functions in the `displayNameHandler`
- 96d6e9e: Support all literal types in typescript
- 96d6e9e: Support flow qualified type names
- 96d6e9e: Support class and function declarations without identifier
- 96d6e9e: Support resolving of destructurings in `resolveToValue`
- 96d6e9e: Improve performance drastically by making changes to AST traversal

  Visitors are now pre-exploded and are cached in the module scope instead of
  creating them on every call. This change brought the benchmark from 170ops/s
  to 225ops/sec

- 96d6e9e: Add codes to errors to be able to easily detect them

  There is a new export `ERROR_CODES` that contains all possible error codes.
  The two errors that have codes right now are:

  - `MISSING_DEFINITION`: No component found in file
  - `MULTIPLE_DEFINITIONS`: Multiple components found in one files

- 96d6e9e: Support handling `useImperativeHandle` correctly

### Patch Changes

- 96d6e9e: Handle `React.forwardRef` calls without a function
- 96d6e9e: Handle some edge cases in resolveToValue
- 96d6e9e: Remove trailing commas and semicolons from raw values in the
  documentation
- 96d6e9e: Parse jsdoc comments for TypeScript structs
- 96d6e9e: Correctly handle ObjectProperties in `isReactComponentMethod`
- 96d6e9e: Add support for TSAsExpressions when trying to stringify expressions

## [6.0.0-alpha.3](https://github.com/reactjs/react-docgen/compare/v6.0.0-alpha.2...v6.0.0-alpha.3) (2022-06-13)

### Bug Fixes

- Correctly detect index access types in typescript
  ([#400](https://github.com/reactjs/react-docgen/issues/400))
  ([85ea6a5](https://github.com/reactjs/react-docgen/commit/85ea6a518c837e209043d9dac1505f60e8dd33b6))
- Correctly handle ObjectTypeSpreadProperty in object type annotations
  ([#593](https://github.com/reactjs/react-docgen/issues/593))
  ([395f338](https://github.com/reactjs/react-docgen/commit/395f338ab8aa3f1d9e1c0f5a81dadd0ce00eb7d5))
- Fix typescript types for parsing
  ([34c55ac](https://github.com/reactjs/react-docgen/commit/34c55ac1d663cc604f4f548018d78e02e081a797))
- Fix wrong detection of forwardRef in combination with memo
  ([#592](https://github.com/reactjs/react-docgen/issues/592))
  ([ea9cbeb](https://github.com/reactjs/react-docgen/commit/ea9cbebef13de11d591f175438e59b48dbb67025))
- Handle ObjectTypeSpreadProperties which are not resolvable
  ([4b8b721](https://github.com/reactjs/react-docgen/commit/4b8b721e6332185c0964a35329108ccdb64f8bb8))
- Ignore methods in `Object.value()` calls
  ([4fc5b21](https://github.com/reactjs/react-docgen/commit/4fc5b21d899990681287c8d9d70771b7361ec41e))

## [6.0.0-alpha.2](https://github.com/reactjs/react-docgen/compare/v6.0.0-alpha.1...v6.0.0-alpha.2) (2022-04-04)

### Bug Fixes

- Change folder name inside the npm package back to `dist`.
  ([5f3da8c](https://github.com/reactjs/react-docgen/commit/5f3da8c892fd052db470d0a44d13c704eef4d011))
  There was no real reason to change this and happened during the TypeScript
  migration.

## 6.0.0-alpha.1 (2022-04-04)

### Bug Fixes

- Fix for expressionTo with Spread and Methods
  ([5f3da8c](https://github.com/reactjs/react-docgen/commit/5f3da8c892fd052db470d0a44d13c704eef4d011))
- Remove obsolete id check
  ([66961d8](https://github.com/reactjs/react-docgen/commit/66961d868fb09cbf2a96ea5a4edec602602851b3))
- Remove usage of ast-type builders
  ([17c8a9c](https://github.com/reactjs/react-docgen/commit/17c8a9c123e0b699e96137e8714cd57fe6200e0c))

### Features

- Migrate to TypeScript
  ([7b35e6f](https://github.com/reactjs/react-docgen/commit/7b35e6f1336c6c606b194b2d0e70376e9c1c0a9d))
- Remove building out of scope AST Nodes from resolveToValue
  ([5bcf56c](https://github.com/reactjs/react-docgen/commit/5bcf56c6f7d2d8118adc1ed80573f2e3555455cb))

### BREAKING CHANGES

- `resolveToValue` will not create a `MemberExpression` for targets ending in
  destructuring. It will now simply resolve to the `Identifier` inside the
  destructuring. Use new helper `isDestructuringAssignment` to further check
  this identifier.
- The helpers `resolveObjectValuesToArray` and `resolveObjectKeysToArray` return
  now `string[]` instead of a `NodePath`
