# Changelog

## [6.0.0-alpha.4](https://github.com/reactjs/react-docgen/compare/react-docgen-v6.0.0-alpha.3...react-docgen-v6.0.0-alpha.4) (2022-12-10)


### ⚠ BREAKING CHANGES

* The lowest supported version of Node.js is now 14.17.0
* The main API changed and now includes only 2 arguments. Read MIGRATE.md for more info.

### Features

* Add code to errors to easily detect them ([3b342f4](https://github.com/reactjs/react-docgen/commit/3b342f4aeb378a0e2023b5d0e7078eb124d1c29e))
* Add support for resolving destructuring in resolveToValue ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Add support for useImperativeHandle ([8521445](https://github.com/reactjs/react-docgen/commit/852144505c48bb9645ff05c1792c13de2b27c74c))
* Improve performance by creating all visitors only once ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Introduce new CLI ([3b28f6e](https://github.com/reactjs/react-docgen/commit/3b28f6ee864fddbd872441035b21ad416ae7f417))
* migrate react-docgen to ESM and vitest ([#688](https://github.com/reactjs/react-docgen/issues/688)) ([2c8cdb6](https://github.com/reactjs/react-docgen/commit/2c8cdb6ca51c83807d3cfa496c94d2f0b65c07ae))
* Migrate to babel toolchain ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* New main API ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Provide a default importer in parallel to the factory ([5bdc615](https://github.com/reactjs/react-docgen/commit/5bdc61594011df068bebb57614636353ebc91d3b))
* rename flowTypeHandler to codeTypeHandler ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Treat functions returning React.Children.map as Components ([c2e0679](https://github.com/reactjs/react-docgen/commit/c2e06796021df5d8f6e1bc7bc92a20e4e00ab02b))


### Bug Fixes

* Add `.cts` and `.mts` support for typescript ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Add support for TSAsExpressions when trying to stringify expressions ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Correctly handle ObjectProperties in isReactComponentMethod ([91b85f6](https://github.com/reactjs/react-docgen/commit/91b85f6fd1f12c58836ee77a4cfc5c83bebc4c7a))
* Filter out estree plugin ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Handle React.forwardRef calls without a function ([f2d9ac0](https://github.com/reactjs/react-docgen/commit/f2d9ac0e6d5a96b7730dd41a94c627913d801488))
* Handle some edge cases in resolveToValue ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Relax Node.js requirement to 14.15.0 as minimum ([28323a7](https://github.com/reactjs/react-docgen/commit/28323a764c9f001f3e785cd41119e31a345aa98e))
* remove trailing comma and semi from raw value ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* rename exports and fix exports of importers ([#690](https://github.com/reactjs/react-docgen/issues/690)) ([0c2891d](https://github.com/reactjs/react-docgen/commit/0c2891d341796a05062276ab08ef1207de6770d6))
* require node 14.18 or later ([#664](https://github.com/reactjs/react-docgen/issues/664)) ([f41b034](https://github.com/reactjs/react-docgen/commit/f41b0349c33314a516566914de68a871ceb42240))
* Simplify resolveObjectValuesToArray and remove type handling ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Support all literal types in typescript ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Support all possible kinds of functions in the `displayNameHandler` ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* Support class and function declarations without identifier ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* support qualified type names ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))
* **ts:** parse jsdoc comment for ts structs ([#663](https://github.com/reactjs/react-docgen/issues/663)) ([8cc081e](https://github.com/reactjs/react-docgen/commit/8cc081e71b8c740105fd95f673c68abedc4fbd63))
* Update default babel options ([4e9e437](https://github.com/reactjs/react-docgen/commit/4e9e4370ab1fe3775c0ebbfe57bedb03669868bf))


### Miscellaneous Chores

* Link versions for both packages ([fc81d1d](https://github.com/reactjs/react-docgen/commit/fc81d1de8188c440baa2c0ea5a630386b1a94cbc))

## [6.0.0-alpha.3](https://github.com/reactjs/react-docgen/compare/v6.0.0-alpha.2...v6.0.0-alpha.3) (2022-06-13)

### Bug Fixes

- Correctly detect index access types in typescript ([#400](https://github.com/reactjs/react-docgen/issues/400)) ([85ea6a5](https://github.com/reactjs/react-docgen/commit/85ea6a518c837e209043d9dac1505f60e8dd33b6))
- Correctly handle ObjectTypeSpreadProperty in object type annotations ([#593](https://github.com/reactjs/react-docgen/issues/593)) ([395f338](https://github.com/reactjs/react-docgen/commit/395f338ab8aa3f1d9e1c0f5a81dadd0ce00eb7d5))
- Fix typescript types for parsing ([34c55ac](https://github.com/reactjs/react-docgen/commit/34c55ac1d663cc604f4f548018d78e02e081a797))
- Fix wrong detection of forwardRef in combination with memo ([#592](https://github.com/reactjs/react-docgen/issues/592)) ([ea9cbeb](https://github.com/reactjs/react-docgen/commit/ea9cbebef13de11d591f175438e59b48dbb67025))
- Handle ObjectTypeSpreadProperties which are not resolvable ([4b8b721](https://github.com/reactjs/react-docgen/commit/4b8b721e6332185c0964a35329108ccdb64f8bb8))
- Ignore methods in `Object.value()` calls ([4fc5b21](https://github.com/reactjs/react-docgen/commit/4fc5b21d899990681287c8d9d70771b7361ec41e))

## [6.0.0-alpha.2](https://github.com/reactjs/react-docgen/compare/v6.0.0-alpha.1...v6.0.0-alpha.2) (2022-04-04)

### Bug Fixes

- Change folder name inside the npm package back to `dist`. ([5f3da8c](https://github.com/reactjs/react-docgen/commit/5f3da8c892fd052db470d0a44d13c704eef4d011))
  There was no real reason to change this and happened during the TypeScript migration.

## 6.0.0-alpha.1 (2022-04-04)

### Bug Fixes

- Fix for expressionTo with Spread and Methods ([5f3da8c](https://github.com/reactjs/react-docgen/commit/5f3da8c892fd052db470d0a44d13c704eef4d011))
- Remove obsolete id check ([66961d8](https://github.com/reactjs/react-docgen/commit/66961d868fb09cbf2a96ea5a4edec602602851b3))
- Remove usage of ast-type builders ([17c8a9c](https://github.com/reactjs/react-docgen/commit/17c8a9c123e0b699e96137e8714cd57fe6200e0c))

### Features

- Migrate to TypeScript ([7b35e6f](https://github.com/reactjs/react-docgen/commit/7b35e6f1336c6c606b194b2d0e70376e9c1c0a9d))
- Remove building out of scope AST Nodes from resolveToValue ([5bcf56c](https://github.com/reactjs/react-docgen/commit/5bcf56c6f7d2d8118adc1ed80573f2e3555455cb))

### BREAKING CHANGES

- `resolveToValue` will not create a `MemberExpression` for targets ending in destructuring. It will now simply resolve to the `Identifier` inside the destructuring. Use new helper `isDestructuringAssignment` to further check this identifier.
- The helpers `resolveObjectValuesToArray` and `resolveObjectKeysToArray` return now `string[]` instead of a `NodePath`
