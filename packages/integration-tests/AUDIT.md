# Disabled unit-test behavior audit

This audit maps each disabled legacy unit-test suite to its portable integration
disposition. Parameterized cases are grouped when one readable fixture exposes
the same public JSON. Invalid `NodePath` inputs and helper-only intermediate
values are internal implementation details, not public `parse()` behavior.

Disposition vocabulary:

- **existing integration case**: represented by a migrated golden case.
- **new integration case**: represented by a case added during this audit.
- **duplicate observable behavior**: another named case already asserts the same
  public JSON or error.
- **internal-only implementation detail**: no distinct public output exists.
- **excluded custom configuration**: requires a non-default resolver, handler,
  importer, or parser option.

## Public facade and resolvers

| Disabled suite | Disposition | Corpus coverage or reason |
| --- | --- | --- |
| `main-test.ts`, `parse-test.ts` | new integration case | `js/definitions/function-declaration`, `js/errors/missing-definition`, and `js/errors/multiple-definitions` cover default parse output and stable public errors. Parser/options validation is excluded custom configuration. |
| `FindExportedDefinitionsResolver-test.ts` | existing integration case | Definition, default/named/CommonJS export, re-export, HOC, and error cases. |
| `FindAnnotatedDefinitionsResolver-test.ts` | new integration case | `js/definitions/annotated-function`. |
| `FindAllDefinitionsResolver-test.ts` | excluded custom configuration | Public only when callers replace the default resolver. |
| `ChainResolver-test.ts` | internal-only implementation detail | Resolver composition has no independent documentation output. |
| `runResolver-test.ts` | internal-only implementation detail | Adapter for resolver return shapes; covered transitively by every case. |

## Handlers

| Disabled suite | Disposition | Corpus coverage or reason |
| --- | --- | --- |
| `codeTypeHandler-test.ts` | new integration case | `typescript/types/comprehensive-props`, `typescript/types/advanced-props`, and `flow/types/comprehensive-props`. |
| `componentDocblockHandler-test.ts` | existing integration case | Component descriptions across JS, Flow, TypeScript, HOCs, and imported definitions. |
| `componentMethodsHandler-test.ts` | existing integration case | JS/TypeScript class and imperative-handle method cases. |
| `componentMethodsJsDocHandler-test.ts` | new integration case | `js/methods/parameter-shapes` plus migrated `js/methods/class-method-documentation`. |
| `defaultPropsHandler-test.ts` | new integration case | Migrated static/function/default cases plus `js/defaults/spreads-and-parameters` and `typescript/defaults/function-default-parameters`. |
| `displayNameHandler-test.ts` | existing integration case | Function/class/CreateClass/forwardRef/HOC display names. Unresolvable artificial expressions are duplicate observable behavior: absent `displayName`. |
| `propDocblockHandler-test.ts` | duplicate observable behavior | Descriptions are asserted throughout JS PropTypes and typed prop cases. |
| `propTypeCompositionHandler-test.ts` | existing integration case | Flow/TypeScript intersections, interface extension, spreads, and imported types. |
| `propTypeHandler-test.ts` | new integration case | `js/props/all-proptypes`, `js/props/object-key-and-value-enums`, and migrated shape/context cases cover public validators and requiredness. Custom PropTypes aliases are excluded custom configuration. |

## Utility suites with distinct public output

| Disabled suite(s) | Disposition | Corpus coverage or reason |
| --- | --- | --- |
| `docblock-test.ts`, `parseJsDoc-test.ts`, `setPropDescription-test.ts` | new integration case | Documentation, prop descriptions, method descriptions, parameters, returns, and nested return docs are asserted by documentation/method/type cases. Malformed raw doctrine input is internal-only. |
| `getParameterName-test.ts`, `getMethodDocumentation-test.ts` | new integration case | `js/methods/parameter-shapes` asserts identifiers, defaults, object/array patterns, rest parameters, and JSDoc association. TypeScript parameter properties are constructor-only and do not produce public method docs. |
| `getPropType-test.ts`, `isRequiredPropType-test.ts` | new integration case | Full validator families, nested shapes, unions, enums from object keys/values, and required validators. Invalid direct helper arguments are internal-only. |
| `getFlowType-test.ts`, `flowUtilityTypes-test.ts`, `isUnreachableFlowType-test.ts`, `resolveGenericTypeAnnotations-test.ts` | existing integration case | Comprehensive props, utility types, React/DOM types, generics, intersections, spreads, interfaces, imports, and historical regressions. Unsupported/unreachable annotations have no distinct public field. |
| `getTSType-test.ts`, `unwrapBuiltinTSPropTypes-test.ts` | new integration case | Comprehensive and advanced TypeScript props cover primitives, literals, arrays, tuples, unions, intersections, objects, functions, `typeof`, `keyof`, indexed access, mapped types, qualified React types, call/index/method signatures, and built-ins. |
| `resolveObjectKeysToArray-test.ts`, `resolveObjectValuesToArray-test.ts` | new integration case | `js/props/object-key-and-value-enums`; unresolved expressions are already represented by unresolved enum behavior. |
| `printValue-test.ts`, `expressionTo-test.ts`, `getNameOrValue-test.ts` | existing integration case | Defaults, literals, enum values, computed properties, and imported/re-exported constants assert their reachable serialized forms. Invalid isolated AST kinds are internal-only. |
| `resolveToValue-test.ts`, `resolveFunctionDefinitionToReturnValue-test.ts`, `findFunctionReturn-test.ts` | existing integration case | Function components, HOCs, forwardRef/memo, default values, and imported values cover successful public resolution. Ambiguous helper states have no separate output. |
| `resolveHOC-test.ts`, `normalizeClassDefinition-test.ts`, `getTypeFromReactComponent-test.ts` | existing integration case | HOC-wrapped, custom base, PureComponent, forwardRef, memo, generic class, and polymorphic forwardRef cases. |
| `getMemberValuePath-test.ts`, `getClassMemberValuePath-test.ts`, `getMemberExpressionValuePath-test.ts`, `getPropertyValuePath-test.ts`, `getMembers-test.ts`, `getPropertyName-test.ts` | existing integration case | Static/member/default/PropTypes/computed/spread cases cover all publicly observable successful lookups. Invalid or missing members yield the already-covered absent field. |
| `resolveExportDeclaration-test.ts`, `resolveToModule-test.ts` | existing integration case | ESM, CommonJS, namespace, star, member, imported-type, and re-export chains. Importer failures beyond default filesystem behavior are excluded custom configuration. |
| `resolveObjectPatternPropertyToValue-test.ts` | new integration case | Function parameter defaults and destructured defaults. Missing properties produce the same absent default output. |

## Predicate and structural utility suites

These suites decide which already-covered component/export path is selected.
Their false branches do not create distinct public output, so isolated predicate
matrices would only reproduce implementation tests.

| Disabled suites | Disposition | Corpus coverage or reason |
| --- | --- | --- |
| `isReactChildrenElementCall-test.ts`, `isReactCreateElementCall-test.ts`, `isReactCloneElementCall-test.ts` | duplicate observable behavior | React node/element PropTypes and JSX component cases. |
| `isReactForwardRefCall-test.ts`, `isReactCreateClassCall-test.ts`, `isStatelessComponent-test.ts`, `isReactComponentClass-test.ts`, `isReactComponentMethod-test.ts` | duplicate observable behavior | Existing definitions, defaults, methods, Flow, TypeScript, forwardRef, memo, and class cases. |
| `isReactBuiltinReference-test.ts`, `isReactModuleName-test.ts` | duplicate observable behavior | `React.PropTypes`, package `prop-types`, React classes, and namespace/import cases. Custom module aliases are excluded custom configuration. |
| `isDestructuringAssignment-test.ts`, `isExportsOrModuleAssignment-test.ts`, `getMemberExpressionRoot-test.ts` | duplicate observable behavior | Destructured defaults, CommonJS exports, and member/re-export cases. |
| `getTypeAnnotation-test.ts`, `getTypeParameters-test.ts` | duplicate observable behavior | Generic Flow/TypeScript, function, array, React, and imported type cases. |

## Coverage batches

| Batch | Cases added | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: | ---: |
| Migrated legacy baseline | 49 | 71.33% | 61.78% | 79.43% | 71.99% |
| First expansion: definitions, exports, errors, props, defaults, methods, TypeScript, Flow | 12 | 74.81% | 63.38% | 85.44% | 75.47% |
| Object enums, method parameter shapes, advanced TypeScript | 3 | 79.28% | 68.18% | 89.55% | 79.86% |
| Advanced Flow, value serialization, display-name resolution | 3 | 81.47% | 70.38% | 93.35% | 82.08% |
| Typed method modifiers and signatures | 1 | 81.81% | 71.21% | 93.35% | 82.44% |
| React prop wrappers, class normalization, computed keys/exports, display names | 6 | 83.35% | 73.05% | 93.35% | 83.90% |
| JSDoc variants, composed validators, imported defaults/enums | 3 | 83.85% | 73.70% | 94.62% | 84.40% |
| Nested configured HOCs and destructured bindings | 2 | 84.05% | 74.06% | 94.62% | 84.61% |

The final default-configuration plateau is 84.05% statements, 74.06% branches,
94.62% functions, and 84.61% lines. Enforced integer floors are 84%, 74%, 94%,
and 84%, respectively. The former unit-and-integration suite reached about 92%
statements because it directly exercised custom resolvers, public helper APIs,
and synthetic invalid AST paths outside default `parse()`.

After unit-test discovery was restored, the complete suite established the
following baseline:

| Suite | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Portable integration corpus | 84.05% | 74.06% | 94.62% | 84.61% |
| Complete unit and integration suite | 95.03% | 88.78% | 98.41% | 95.45% |

These are separate contracts. Integration coverage measures parser-portable
observable behavior through default `parse()`. Complete-suite coverage also
measures Babel-specific internals, extension helpers, custom resolvers, and
synthetic invalid AST states. The integration thresholds therefore remain based
on the portable corpus rather than the complete-suite percentages.

## Remaining audit

Remaining uncovered regions were checked against default `parse()` reachability.
Valid final exclusions are:

1. False/error branches of internal AST helpers whose public result duplicates
   an absent documentation field.
2. Custom resolver, handler, importer, and parser-option paths excluded from the
   default parse corpus.
3. Parser-version-specific syntax/error behavior excluded from parser-neutral
   goldens.
4. Defensive branches requiring invalid or manually constructed Babel paths,
   unreachable through public parsing.

The largest excluded regions are `FindAllDefinitionsResolver`, which requires a
custom resolver; `expressionTo` object/array serialization, exposed as a direct
helper API; invalid-input branches in `getNameOrValue`; and internal resolution
states that only unit tests can construct. The final HOC/destructuring batch
added only 0.20 statement points, and the destructuring helper remained
unchanged, confirming diminishing default-flow coverage.

No production source or coverage-directive comment was added.
