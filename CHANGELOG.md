# Changelog

## [6.0.0-alpha.4](https://github.com/reactjs/react-docgen/compare/v6.0.0-alpha.3...v6.0.0-alpha.4) (2022-08-14)


### ⚠ BREAKING CHANGES

* The main API changed and now includes only 2 arguments. Read MIGRATE.md for more info.
* The return values of `resolveObjectValuesToArray` are now in the order they are defined in the source code.
* Internally react-docgen now uses babel only. There are tons of breaking changes in this new version. Read the MIGRATE.md

### Features

* Add support for resolving destructuring in resolveToValue ([227f8ea](https://github.com/reactjs/react-docgen/commit/227f8ea2a35e122b40fb6ac7a72979792f97291f))
* Improve performance by creating all visitors only once ([17c0ea4](https://github.com/reactjs/react-docgen/commit/17c0ea4b988f916ec370dbdc374cdf8fe9374a56))
* Improve performance drastically by changing traversing ([136ccba](https://github.com/reactjs/react-docgen/commit/136ccbafa62f421f22df920619a31eb43c33d465))
* Migrate to babel toolchain ([d3f8145](https://github.com/reactjs/react-docgen/commit/d3f814542211652160cde02aeaefdbd994f2f6f5))
* New main API ([209d856](https://github.com/reactjs/react-docgen/commit/209d85671f9acd6a5f67a3d1e0c35e7eff38fe52))
* rename flowTypeHandler to codeTypeHandler ([9fe1930](https://github.com/reactjs/react-docgen/commit/9fe1930e8dc6f4e157f549c0a2647d8258bba8e4))


### Bug Fixes

* Add `.cts` and `.mts` support for typescript ([1f8716a](https://github.com/reactjs/react-docgen/commit/1f8716a0e2c3f3c159464005ccd3044402653510))
* Add support for TSAsExpressions when trying to stringify expressions ([#634](https://github.com/reactjs/react-docgen/issues/634)) ([51e56b6](https://github.com/reactjs/react-docgen/commit/51e56b6e5e7b366af836b950ef8fc843c6ba920b))
* **deps:** pin dependencies ([b570fc1](https://github.com/reactjs/react-docgen/commit/b570fc1adf667d529d6e3c15abd19e5622fa7b3f))
* Filter out estree plugin ([28d8c62](https://github.com/reactjs/react-docgen/commit/28d8c62f3d900117c0789295dd547c2cec2facda))
* Handle some edge cases in resolveToValue ([daf49bb](https://github.com/reactjs/react-docgen/commit/daf49bb4077cdcc1fa84fad3e712499ab6a57858))
* remove trailing comma and semi from raw value ([28db0f4](https://github.com/reactjs/react-docgen/commit/28db0f47dc22acc9e81c4dbe98b8fb141b61bcdd))
* Simplify resolveObjectValuesToArray and remove type handling ([4e2318e](https://github.com/reactjs/react-docgen/commit/4e2318e092f03361e5144b13833f4069357376a7))
* Support all literal types in typescript ([d98021f](https://github.com/reactjs/react-docgen/commit/d98021f88887a1472e88a86aa3bb14c32bba7508))
* Support all possible kinds of functions in the `displayNameHandler` ([9a22e98](https://github.com/reactjs/react-docgen/commit/9a22e98c283a22a639bb9e6f8758b3809421832d))
* Support class and function declarations without identifier ([0d76915](https://github.com/reactjs/react-docgen/commit/0d769156d8b8019856d221166bb33096f068d6d7))
* support qualified type names ([a90e7ae](https://github.com/reactjs/react-docgen/commit/a90e7ae563744c2fd4435e84e915b77885985a10))
* Update default babel options ([2b5caf3](https://github.com/reactjs/react-docgen/commit/2b5caf350015c35551c7e0f09d3e64bbbe6c0c0d))
