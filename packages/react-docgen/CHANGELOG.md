# Release Notes

## 7.0.1

### Patch Changes

- [#870](https://github.com/reactjs/react-docgen/pull/870)
  [`2b51bbd`](https://github.com/reactjs/react-docgen/commit/2b51bbd47d14638ff98014a59f52c13a0c88abf9)
  Thanks [@renovate](https://github.com/apps/renovate)! - update dependency
  @types/doctrine to ^0.0.9

## 7.0.0

### Major Changes

- [#846](https://github.com/reactjs/react-docgen/pull/846)
  [`82154c3`](https://github.com/reactjs/react-docgen/commit/82154c3b59bf22acf3068165f87b089138fdf7ae)
  Thanks [@danez](https://github.com/danez)! - `getTypeFromReactComponent` now
  returns an array of paths to types instead of just one. This can appear when
  multiple type definitions are found for a component, for example:

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

- [#848](https://github.com/reactjs/react-docgen/pull/848)
  [`dda8915`](https://github.com/reactjs/react-docgen/commit/dda8915ce9f8d5065372570d590405f2c2403bd8)
  Thanks [@danez](https://github.com/danez)! - Drop support for Node.js
  version 14.

  The minimum supported version is now 16.14.0

- [#846](https://github.com/reactjs/react-docgen/pull/846)
  [`62e692f`](https://github.com/reactjs/react-docgen/commit/62e692fcca6f3d17dcf81ce72f2db1a95b2d694b)
  Thanks [@danez](https://github.com/danez)! - `resolveToValue` will not resolve
  to `ImportDeclaration` anymore but instead to one of the possible specifiers
  (`ImportSpecifier`, `ImportDefaultSpecifier` or `ImportNamespaceSpecifier`).
  This gives better understanding to which specifier exactly `resolveToValue`
  did resolve a NodePath to.

  Here is a possible easy fix for this in a code snippet that uses
  `resolveToValue`

  ```diff
  const resolved = resolveToValue(path);

  -if (resolved.isImportDeclaration()) {
  +if (resolved.parentPath?.isImportDeclaration()) {
      // do smth
  }
  ```

### Minor Changes

- [#862](https://github.com/reactjs/react-docgen/pull/862)
  [`40ebb00`](https://github.com/reactjs/react-docgen/commit/40ebb0010a7a380f89e0c79a4a937cf9a50a3245)
  Thanks [@danez](https://github.com/danez)! - Support `PropsWithoutRef`,
  `PropsWithRef` and `PropsWithChildren` in TypeScript.

  Component props are now detected correctly when these builtin types are used,
  but they do currently not add any props to the documentation.

- [#846](https://github.com/reactjs/react-docgen/pull/846)
  [`82154c3`](https://github.com/reactjs/react-docgen/commit/82154c3b59bf22acf3068165f87b089138fdf7ae)
  Thanks [@danez](https://github.com/danez)! - Add support for `React.FC` in
  TypeScript.

### Patch Changes

- [`6312f2f`](https://github.com/reactjs/react-docgen/commit/6312f2f47b9f679b5bf923a30855e813193ed4af)
  Thanks [@renovate[bot]](https://github.com/renovate%5Bbot%5D)! - update
  dependency @types/doctrine to ^0.0.7

- [#846](https://github.com/reactjs/react-docgen/pull/846)
  [`c01d1a0`](https://github.com/reactjs/react-docgen/commit/c01d1a00fdba76cea38eebc953fd3d2dd3f12fbd)
  Thanks [@danez](https://github.com/danez)! - Fix detection of react class
  components when super class is imported via named import.

- [#861](https://github.com/reactjs/react-docgen/pull/861)
  [`74b6680`](https://github.com/reactjs/react-docgen/commit/74b6680910037b1b4b64dd57769b652bf775675e)
  Thanks [@renovate](https://github.com/apps/renovate)! - update dependency
  @types/doctrine to ^0.0.8

- [#846](https://github.com/reactjs/react-docgen/pull/846)
  [`0641700`](https://github.com/reactjs/react-docgen/commit/0641700e4425390c0fe50e216a71e5e18322ab3b)
  Thanks [@danez](https://github.com/danez)! - Remove unnecessary call to
  `resolveToValue` when trying to find props type from react components.

- [#858](https://github.com/reactjs/react-docgen/pull/858)
  [`3be404e`](https://github.com/reactjs/react-docgen/commit/3be404eee6c8fc7bd867fea9d1987b7f438107d6)
  Thanks [@danez](https://github.com/danez)! - Fix detection of React.Children
  with ESM imports

## 6.0.4

### Patch Changes

- [#838](https://github.com/reactjs/react-docgen/pull/838)
  [`8ba9ac7`](https://github.com/reactjs/react-docgen/commit/8ba9ac74279c74f06803773a1dc5acc50376b5f3)
  Thanks [@danez](https://github.com/danez)! - Support index types correctly in
  flow

## 6.0.3

### Patch Changes

- [#830](https://github.com/reactjs/react-docgen/pull/830)
  [`c3c16e3`](https://github.com/reactjs/react-docgen/commit/c3c16e30ad4cffa7304543ff4bef9b4f13a05683)
  Thanks [@danez](https://github.com/danez)! - Fixed error with object and array
  patterns in function signatures.

## 6.0.2

### Patch Changes

- [#810](https://github.com/reactjs/react-docgen/pull/810)
  [`ddf4e20`](https://github.com/reactjs/react-docgen/commit/ddf4e20160c41685d81f7d5d8cf21eccb4b41529)
  Thanks [@danez](https://github.com/danez)! - Read docblock in nested flow
  object types and use them as descriptions

## 6.0.1

### Patch Changes

- [#806](https://github.com/reactjs/react-docgen/pull/806)
  [`c7e2bd5`](https://github.com/reactjs/react-docgen/commit/c7e2bd5911d660b42bc3bc8b368a7b7cdcf980fd)
  Thanks [@danez](https://github.com/danez)! - Make docblocks for assigned
  methods be correctly detected.

## 6.0.0

### Major Changes

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Rename `flowTypeHandler` to
  `codeTypeHandler` because it handles Flow and TypeScript

- [#719](https://github.com/reactjs/react-docgen/pull/719)
  [`d7a39af`](https://github.com/reactjs/react-docgen/commit/d7a39af7162c312daba2be428613cb378cce0727)
  Thanks [@danez](https://github.com/danez)! - Refactored
  `resolveComponentDefinition` utility.

  - Renamed to `findComponentDefinition`
  - Removed named export `isComponentDefinition`
  - The utility now does a lot more than previously, check out the commit to see
    the changes in detail.

- [#761](https://github.com/reactjs/react-docgen/pull/761)
  [`dfc2f85`](https://github.com/reactjs/react-docgen/commit/dfc2f85ae10a668880ed64710a5acd714edf3bf7)
  Thanks [@danez](https://github.com/danez)! - Renamed `propDocBlockHandler` to
  `propDocblockHandler` for consistency

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Simplify
  `resolveObjectValuesToArray` and remove type handling. None of the code that
  was handling types was used.

- [`caae6bf`](https://github.com/reactjs/react-docgen/commit/caae6bf74ee292a513d6610350d5790c9d23f931)
  Thanks [@danez](https://github.com/danez)! - The return values of
  `resolveObjectValuesToArray` are now in the order they are defined in the
  source code.

- [#744](https://github.com/reactjs/react-docgen/pull/744)
  [`e956802`](https://github.com/reactjs/react-docgen/commit/e956802a26700bb3f827a4500d9fc18a4eed6599)
  Thanks [@danez](https://github.com/danez)! - Removed match utility.

  The utility can be replaced by babel helpers and is not needed anymore. Also
  using explicit checks like `path.isMemberExpression()` is better for type
  safety and catching potential bugs.

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Migrate react-docgen to ES
  modules. Please read
  [this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

- [#693](https://github.com/reactjs/react-docgen/pull/693)
  [`3b28f6e`](https://github.com/reactjs/react-docgen/commit/3b28f6ee864fddbd872441035b21ad416ae7f417)
  Thanks [@danez](https://github.com/danez)! - The CLI was removed from
  `react-docgen` into its own package `@react-docgen/cli`.

  Check out https://react-docgen.dev/docs/getting-started/cli for the
  documentation.

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - The main `parse` API had some
  breaking changes.

  - The arguments were changed from previously 5 to just 2. The following diff
    illustrates how to migrate:

    ```diff
    -parse(src, resolver, handlers, importer, options: { filename, ...babelOptions})
    +parse(src, { resolver, handlers, importer, filename, babelOptions: {} })
    ```

  - The return type is now always an array, independent of the resolver, even if
    only one component was found in the file.

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - Renamed the method `toObject` to
  `build` in the DocumentationBuilder.

  This method might be used by integrations.

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Renamed some of the main exports
  for clarity.

  Renamed `handlers` to `builtinHandlers` Renamed `resolver` to
  `builtinResolvers` Renamed `importers` to `builtinImporters`

- [#743](https://github.com/reactjs/react-docgen/pull/743)
  [`5215bab`](https://github.com/reactjs/react-docgen/commit/5215babf11e9c8a672d86816d1250c1e54b22249)
  Thanks [@danez](https://github.com/danez)! - Removed support for the
  `@extends React.Component` annotation on react class components.

  Instead, you can use the new `@component` annotation or define your own
  annotation by creating a custom `FindAnnotatedDefinitionsResolver` instance

- [#714](https://github.com/reactjs/react-docgen/pull/714)
  [`80e4c74`](https://github.com/reactjs/react-docgen/commit/80e4c747c19d80081c162118f9c7110916fc27a0)
  Thanks [@danez](https://github.com/danez)! - Renamed and migrated built-in
  resolvers to classes.

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

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Migrated to babel toolchain

  This is one of the big changes in this new version of react-docgen. It made
  the code a lot more robust because there are now finally working TypeScript
  types for the ASTs.

  Another benefit from this change is that react-docgen is now a lot faster. 🚀
  In some tests an improvement of nearly 50% was seen in comparison to
  version 5.

- [#707](https://github.com/reactjs/react-docgen/pull/707)
  [`d4c27d4`](https://github.com/reactjs/react-docgen/commit/d4c27d482e6364c38af2f7c871071f475dc40393)
  Thanks [@danez](https://github.com/danez)! - Improve performance of file
  system importer.

  The file system importer now also caches the resolving of files in addition to
  parsing files. If the importer is used in an environment where files do change
  at runtime (like a watch command) then the caches will need to be cleared on
  every file change.

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Changed the minimum Node.js
  version to 14.18.0

### Minor Changes

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Add support for `.cts` and `.mts`
  extension when using typescript

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Treat functions returning
  `React.Children.map` as components

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Improve performance by creating
  all visitors only once

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support all possible kinds of
  functions in the `displayNameHandler`

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - Export the type for the
  DocumentationBuilder.

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - The types `NodePath` and
  `babelTypes` are now exported.

  These types are useful when building integrations in TypeScript.

  `babelTypes` includes all types from `@babel/types`.

- [#714](https://github.com/reactjs/react-docgen/pull/714)
  [`80e4c74`](https://github.com/reactjs/react-docgen/commit/80e4c747c19d80081c162118f9c7110916fc27a0)
  Thanks [@danez](https://github.com/danez)! - Add the new ChainResolver which
  allows multiple resolvers to be chained.

  ```ts
  import { builtinResolvers } from 'react-docgen';

  const { ChainResolver } = builtinResolvers;
  const resolver = new ChainResolver([resolver1, resolver2], {
    chainingLogic: ChainResolver.Logic.ALL, // or ChainResolver.Logic.FIRST_FOUND,
  });
  ```

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support all literal types in
  typescript

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support flow qualified type names

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support class and function
  declarations without identifier

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support resolving of
  destructuring in `resolveToValue`

- [#714](https://github.com/reactjs/react-docgen/pull/714)
  [`80e4c74`](https://github.com/reactjs/react-docgen/commit/80e4c747c19d80081c162118f9c7110916fc27a0)
  Thanks [@danez](https://github.com/danez)! - Allow resolvers to be classes in
  addition to functions.

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

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Improve performance drastically
  by making changes to AST traversal

  Visitors are now pre-exploded and are cached in the module scope instead of
  creating them on every call. This change brought the benchmark from 170ops/s
  to 225ops/sec

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Add codes to errors to be able to
  easily detect them

  There is a new export `ERROR_CODES` that contains all possible error codes.
  The two errors that have codes right now are:

  - `MISSING_DEFINITION`: No component found in a file
  - `MULTIPLE_DEFINITIONS`: Multiple components found in one file

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Support handling
  `useImperativeHandle` correctly

- [#743](https://github.com/reactjs/react-docgen/pull/743)
  [`5215bab`](https://github.com/reactjs/react-docgen/commit/5215babf11e9c8a672d86816d1250c1e54b22249)
  Thanks [@danez](https://github.com/danez)! - Added a new resolver that finds
  annotated components. This resolver is also enabled by default.

  To use this feature simply annotated a component with `@component`.

  ```ts
  // @component
  class MyComponent {}
  ```

### Patch Changes

- [#745](https://github.com/reactjs/react-docgen/pull/745)
  [`8fe3dbf`](https://github.com/reactjs/react-docgen/commit/8fe3dbf510d4d66539bf09db227de5036c125f25)
  Thanks [@danez](https://github.com/danez)! - Fix crash when using TypeScript
  mapped types

- [#789](https://github.com/reactjs/react-docgen/pull/789)
  [`7c99f15`](https://github.com/reactjs/react-docgen/commit/7c99f156b1cc49da8bc78ca9c7e3bb2da215c49d)
  Thanks [@danez](https://github.com/danez)! - Fix TypeScript types when strict
  null checks are disabled

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Handle `React.forwardRef` calls
  without a function

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Fixed the handling of some edge
  cases in resolveToValue

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Remove trailing commas and
  semicolons from raw values in the documentation

- [#767](https://github.com/reactjs/react-docgen/pull/767)
  [`a684d82`](https://github.com/reactjs/react-docgen/commit/a684d8281044b3f8c8baecc9148cd4ef2b8fd409)
  Thanks [@danez](https://github.com/danez)! - Fix handling of `PropTypes.oneOf`
  to handle unresolved imported values correctly

- [#761](https://github.com/reactjs/react-docgen/pull/761)
  [`cc94da2`](https://github.com/reactjs/react-docgen/commit/cc94da24fc9b2107c7e9df8c680a114038cbb16e)
  Thanks [@danez](https://github.com/danez)! - Fix using react-docgen in
  browsers

- [#761](https://github.com/reactjs/react-docgen/pull/761)
  [`98a1138`](https://github.com/reactjs/react-docgen/commit/98a113884a2227a89e5aede84ad48238e5f5c4f0)
  Thanks [@danez](https://github.com/danez)! - Add `displayName` and
  `description` to Documentation type

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Parse jsdoc comments for
  TypeScript structs

- [#748](https://github.com/reactjs/react-docgen/pull/748)
  [`ea25b16`](https://github.com/reactjs/react-docgen/commit/ea25b16deb721a81e9937a307f88854e4b19f56d)
  Thanks [@danez](https://github.com/danez)! - Handle cyclic references in
  PropTypes `shape()` and `exact()` methods.

- [#787](https://github.com/reactjs/react-docgen/pull/787)
  [`5a226ac`](https://github.com/reactjs/react-docgen/commit/5a226ac97882378790291cb67b1c0eee471f9def)
  Thanks [@danez](https://github.com/danez)! - Fix @babel/traverse import to
  work in non ESM environments

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Correctly handle ObjectProperties
  in `isReactComponentMethod`

- [#747](https://github.com/reactjs/react-docgen/pull/747)
  [`1aa0249`](https://github.com/reactjs/react-docgen/commit/1aa0249f293784091260839377f8204eefb1da23)
  Thanks [@danez](https://github.com/danez)! - Handle `typeof import('...')` and
  `typeof MyType.property` correctly in TypeScript

- [`050313d`](https://github.com/reactjs/react-docgen/commit/050313d47c3922276e4a06bcf38836f34f9558fb)
  Thanks [@danez](https://github.com/danez)! - Correctly add LICENSE file to
  published packages

- [`96d6e9e`](https://github.com/reactjs/react-docgen/commit/96d6e9e6003b92604781553f6910812c74c18dad)
  Thanks [@danez](https://github.com/danez)! - Add support for TSAsExpressions
  when trying to stringify expressions

- [#720](https://github.com/reactjs/react-docgen/pull/720)
  [`f6e4fe7`](https://github.com/reactjs/react-docgen/commit/f6e4fe75560b1420388119131a8f49abe52757f6)
  Thanks [@renovate](https://github.com/apps/renovate)! - Update dependency
  strip-indent to v4

- [#769](https://github.com/reactjs/react-docgen/pull/769)
  [`e08e08d`](https://github.com/reactjs/react-docgen/commit/e08e08d6cd56c833fd123019639dca9d819cd7ab)
  Thanks [@danez](https://github.com/danez)! - Correctly resolve the values in
  an `Object.values()` call

## 6.0.0-rc.9

### Patch Changes

- [#789](https://github.com/reactjs/react-docgen/pull/789)
  [`7c99f15`](https://github.com/reactjs/react-docgen/commit/7c99f156b1cc49da8bc78ca9c7e3bb2da215c49d)
  Thanks [@danez](https://github.com/danez)! - Fix TypeScript types when strict
  null checks are disabled

## 6.0.0-rc.8

### Patch Changes

- [#787](https://github.com/reactjs/react-docgen/pull/787)
  [`5a226ac`](https://github.com/reactjs/react-docgen/commit/5a226ac97882378790291cb67b1c0eee471f9def)
  Thanks [@danez](https://github.com/danez)! - Fix @babel/traverse import to
  work in non ESM environments

## 6.0.0-rc.7

### Major Changes

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - Renamed the method `toObject` to
  `build` in the DocumentationBuilder.

  This method might be used by integrations.

### Minor Changes

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - Export the type for the
  DocumentationBuilder.

- [#786](https://github.com/reactjs/react-docgen/pull/786)
  [`0a2481d`](https://github.com/reactjs/react-docgen/commit/0a2481df6328bdbe46a01fb25ee9a0966ec023ca)
  Thanks [@danez](https://github.com/danez)! - The types `NodePath` and
  `babelTypes` are now exported.

  These types are useful when building integrations in TypeScript.

  `babelTypes` includes all types from `@babel/types`.

### Patch Changes

- [#767](https://github.com/reactjs/react-docgen/pull/767)
  [`a684d82`](https://github.com/reactjs/react-docgen/commit/a684d8281044b3f8c8baecc9148cd4ef2b8fd409)
  Thanks [@danez](https://github.com/danez)! - Fix handling of `PropTypes.oneOf`
  to handle unresolved imported values correctly

- [#769](https://github.com/reactjs/react-docgen/pull/769)
  [`e08e08d`](https://github.com/reactjs/react-docgen/commit/e08e08d6cd56c833fd123019639dca9d819cd7ab)
  Thanks [@danez](https://github.com/danez)! - Correctly resolve the values in
  an `Object.values()` call

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

  Check out https://react-docgen.dev/docs/getting-started/cli/ for the
  documentation.

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
