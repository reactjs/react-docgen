# Changelog

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
