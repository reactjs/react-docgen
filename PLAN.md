# Parser-Neutral react-docgen Roadmap

## Status

- Current milestone: 6 — Stable release and migration
- Overall status: Default extraction parity complete; public API and release
  hardening remain
- Last updated: 2026-10-31

## Release-readiness summary

- Default JavaScript and PropTypes behavior is covered across the TypeScript,
  Hermes, and Babel adapters.
- TypeScript behavior is covered except for one fixture that uses Babel-only
  `export defaultFrom from` syntax and must be reclassified.
- Flow behavior is covered through Hermes.
- Defaults, descriptions, methods, imports, exports, and parser-neutral error
  output are represented by portable fixtures.
- Neutral handler, resolver, importer, and parser contracts exist, but not every
  legacy public extension point has a stable replacement yet.
- Parser routing is implemented per file, but the mixed TypeScript/Hermes exit
  criterion still needs a real cross-parser integration fixture.
- The parser-neutral `react-docgen` facade, native CLI parser configuration,
  migration documentation, and package release validation are not complete.

## Decisions

1. `@react-docgen/core` will not depend on Babel, Hermes, or TypeScript.
2. The core will own the smallest path, traversal, and scope implementation
   needed by react-docgen.
3. Parser adapters will normalize their ASTs into an ESTree-inspired internal
   representation.
4. TypeScript will be the first production adapter. Hermes and Flow will follow.
5. Parser selection will happen per file, including imported files.
6. The next `react-docgen` major will be a parser-neutral facade with no default
   parser.
7. Babel-shaped extension APIs may break in that major. `react-docgen@8` remains
   the legacy line during migration.
8. Documentation output, not raw AST equality, is the compatibility contract.

## Target packages

- `@react-docgen/core`: normalized AST, paths, traversal, scopes, extraction,
  and parser routing.
- `@react-docgen/typescript`: `typescript-estree` adapter and preconfigured
  `parse()`.
- `@react-docgen/hermes`: Hermes adapter and preconfigured `parse()`.
- `@react-docgen/babel`: optional compatibility adapter and differential-test
  reference.
- `react-docgen@8`: maintained legacy Babel implementation.
- Next `react-docgen` major: facade over `@react-docgen/core` composition APIs.

## Milestone 0 — Stabilize and specify

- [x] Keep the existing package build and test suite green while experimental
      work proceeds separately.
- [x] Record architecture and package decisions in this plan.
- [x] Classify fixtures as `common`, `typescript`, `flow`, or `babel-specific`.
- [x] Reuse the existing integration snapshot harness as parser-independent
      golden output.
- [x] Use the current Babel integration snapshots as the migration reference.

Exit criteria: existing build and tests pass; fixtures have explicit
capabilities and stable expected documentation output.

## Milestone 1 — Core foundation

- [x] Add `@react-docgen/core` without a parser dependency.
- [x] Define the parser-neutral base node; add concrete normalized nodes only
      with their first TypeScript caller.
- [x] Implement `AstPath`, visitor keys, traversal controls, and minimal
      value/type scope services.
- [x] Add the parser-neutral `Parser`, `FileState`, `ProjectContext`, and
      `Importer` contracts needed for import routing.
- [x] Route imported files back through `ProjectContext` so each file can select
      its parser.

Exit criteria: focused synthetic tests cover paths, traversal, scopes, bindings,
and import routing.

## Milestone 2 — TypeScript vertical slice

- [x] Add `@react-docgen/typescript` using
      `@typescript-eslint/typescript-estree`.
- [x] Normalize JS, JSX, TS, TSX, imports, exports, and required TypeScript type
      nodes.
- [x] Add parser-neutral `Handler` and `Resolver` contracts with their first
      callers.
- [x] Support one complete exported function-component flow: props,
      descriptions, defaults, and documentation output.
- [x] Export both a composable `parser` and a preconfigured `parse()`.

Exit criteria: selected common and TypeScript fixtures match legacy output;
production dependencies contain no Babel package. Scoped `0.x` packages are
ready for an explicitly requested release.

## Milestone 3 — JavaScript and TypeScript parity

- [x] Port resolvers, imports, value resolution, PropTypes, defaults, classes,
      methods, docblocks, and TypeScript type extraction.
- [x] Add normalized Babel adapter for differential testing.
- [x] Define public neutral extension APIs and compile-test custom handlers,
      resolvers, and importers.

Exit criteria: all applicable `common` and `typescript` fixtures match legacy
output; no Babel types leak from new APIs.

## Sidestep — Portable integration fixture corpus

- [x] Move legacy fixtures into a private parser-free workspace package.
- [x] Organize cases by language, behavior, and descriptive case ID.
- [x] Replace the monolithic snapshot with one JSON outcome per case.
- [x] Run all cases through legacy `react-docgen` and a temporary supported-case
      allowlist through `@react-docgen/typescript`.
- [x] Map disabled unit-test behaviors to portable fixtures or narrow, evidenced
      exclusions.
- [x] Add coverage-driven fixtures without production changes or coverage hints.
- [x] Record the integration-only plateau and enforce its integer-floor coverage
      thresholds.

Exit criteria: migrated output remains unchanged; all public behavior
represented by disabled unit tests is covered or classified; legacy integration
coverage cannot silently regress.

## Milestone 4 — Hermes and Flow

- [x] Add `@react-docgen/hermes` and normalize Hermes ESTree and Flow nodes.
- [x] Port Flow extraction and component patterns.
- [x] Run common fixtures through TypeScript, Hermes, and Babel adapters.
- [x] Report unsupported syntax as explicit parser capability errors.

Exit criteria: common JS/JSX output agrees across adapters and Flow output
matches the legacy implementation.

## Milestone 3.1 — Shared React extraction

- [x] Move parser-neutral resolvers, handlers, and value/documentation helpers
      from `@react-docgen/typescript` into `@react-docgen/core`.
- [x] Split shared component metadata extraction from TypeScript prop/type
      extraction.
- [x] Keep TypeScript-only type helpers and handler composition in
      `@react-docgen/typescript`.
- [x] Expose preconfigured `parse()` from `@react-docgen/babel` using only Babel
      plus shared core extraction.
- [x] Keep focused utility tests and JavaScript differential fixtures green.

Exit criteria: Babel and TypeScript adapters share React extraction without
depending on each other; only TypeScript semantics remain in the TypeScript
package; all applicable JavaScript output remains identical.

## Milestone 5 — Mixed-parser projects

- [x] Add ordered `createParserRouter()` rules using filename, glob, or a custom
      selector.
- [x] Require filenames when multiple parsers are configured.
- [x] Route every imported file independently.
- [x] Support parser-specific options per route and explicit no-match errors.
- [x] Add CLI config for single-parser and mixed-parser projects.

Exit criteria: TypeScript and Hermes files can import each other while
preserving exports, bindings, descriptions, and props.

## Milestone 6 — Stable release and migration

- [ ] Decide the final package boundary before freezing APIs: keep shared React
      extraction in core or move it to `@react-docgen/react`, and decide whether
      method JSDoc parsing becomes an optional composition package.
- [ ] Reconcile the intended convenience API with the current composition API:
      either make `createDocgen({ parser })` supply standard React behavior or
      document the required handlers and resolver explicitly.
- [ ] Add a real mixed-parser integration fixture in which TypeScript and Hermes
      files import each other while preserving exports, bindings, descriptions,
      defaults, and props.
- [ ] Reclassify `typescript/imports/reexported-default-values`, whose
      `export defaultFrom from` syntax is Babel-specific, or assert an explicit
      parser capability error.
- [ ] Stabilize scoped packages after parity and extension API validation,
      including exported types and parser-specific options.
- [ ] Release the next `react-docgen` major as a parser-neutral facade with no
      implicit `parse()` backend.
- [ ] Remove Babel-specific extension contracts from the new major.
- [ ] Inventory every legacy public handler, resolver, importer, utility, error,
      `FileState`, and Babel `NodePath` export; implement or document its
      neutral replacement.
- [ ] Update the CLI to configure scoped single-parser and mixed-parser projects
      directly instead of relying only on a custom `parse` function escape
      hatch.
- [ ] Publish package READMEs, a migration guide, release notes, and CLI
      configuration documentation.
- [ ] Validate packed tarballs, clean consumer installs, declaration output,
      package exports, changesets, and the supported Node matrix before
      versioning.
- [ ] Keep `react-docgen@8` available for legacy Babel behavior.

Exit criteria: users must explicitly install/select a parser, and every legacy
public extension point has a documented replacement.

## Public API direction

```ts
import { createDocgen, createParserRouter } from '@react-docgen/core';
import { parser as typescript } from '@react-docgen/typescript';
import { parser as hermes } from '@react-docgen/hermes';

const parser = createParserRouter([
  { test: /\.(?:ts|tsx|mts|cts)$/, parser: typescript },
  { test: /\.(?:js|jsx|mjs|cjs)$/, parser: hermes },
]);

// Final milestone 6 decision: either this convenience form supplies the
// standard React resolver/handlers, or callers compose them explicitly.
const docgen = createDocgen({ parser });
```

Convenience packages will also expose preconfigured APIs:

```ts
import { parse } from '@react-docgen/typescript';
```

## Test policy

- Core tests use synthetic normalized ASTs and load no parser.
- Every adapter runs shared conformance tests for comments, visitor keys, paths,
  scopes, imports, locations, and errors.
- Golden documentation fixtures define compatibility.
- Differential tests compare applicable fixtures across legacy Babel, normalized
  Babel, TypeScript, and Hermes.
- Raw AST equality is never required.

## Plan change log

Record every material plan change here before or with implementation.

### 2026-10-31 — Made CI fixtures portable and unified coverage reporting

- Pin shared fixture line endings to LF and compare CLI paths in their existing
  slash-normalized form on Windows.
- Collect one source-based coverage report across all package projects, so
  adapter integration tests contribute to shared core coverage.
- Keep the existing legacy coverage thresholds and let every CI platform finish
  even when another matrix job fails.

### 2026-10-31 — Ported mixin class props from the maintained legacy line

- Carried #1145/#1157 into the legacy reference and TypeScript adapter,
  preserving React base validation, wrapped props, aliased imports, and
  declared-props fallback.
- Added portable golden cases and composed the TypeScript handler with the Babel
  adapter to check the same output across parser representations.
- Credited the original contribution by @mfazekas in the changeset.

### 2026-09-21 — Audited release readiness after mixed-parser implementation

- Confirmed default JavaScript, TypeScript, and Flow extraction parity across
  the portable corpus, apart from one Babel-only export-syntax fixture currently
  classified as TypeScript.
- Distinguished implemented parser routing from the still-missing real
  TypeScript/Hermes cross-import integration proof.
- Expanded Milestone 6 to cover package boundaries, facade/API stabilization,
  legacy extension migration, native CLI configuration, documentation, and
  packed-package validation.
- Reason: the extraction engine is largely complete, but the stable public
  product surface requires more than publishing the scoped packages.

### 2026-09-21 — Completed mixed-parser projects milestone

- Added ordered parser routing for exact filenames, globs, regular expressions,
  and custom selectors, including per-route parser options and explicit no-match
  errors.
- Required entry filenames when a router has multiple routes and kept imported
  files on the same independent routing path.
- Added CLI config modules that can supply a preconfigured single-parser or
  mixed-parser parse function.
- Reason: parser choice now follows each file through the whole project instead
  of being fixed by the entry point.

### 2026-09-21 — Completed Hermes and Flow milestone

- Added `@react-docgen/hermes` as a thin Hermes parser adapter over shared core
  extraction, with normalization for Hermes ESTree and Flow nodes.
- Ported Flow props and type extraction, including aliases, interfaces,
  utilities, imports, generics, and recursive type protection.
- Added file-based Flow/JavaScript corpus coverage and Babel differential tests;
  unsupported TypeScript-family files now produce an explicit parser capability
  error.
- Reason: Hermes now matches legacy Flow output while common JavaScript output
  remains consistent across parser adapters.

### 2026-08-16 — Added shared React extraction milestone

- Inserted Milestone 3.1 before Hermes work and temporarily made it current.
- Moved parser-neutral React behavior toward `@react-docgen/core`; parser
  packages will compose that behavior with parser/language-specific handlers.
- Reason: Milestone 3 proved Babel could reuse normalized ASTs, but its
  differential runner depended on TypeScript-owned handlers. That dependency
  direction would duplicate behavior for Babel and Hermes.

### 2026-08-16 — Completed shared React extraction milestone

- Moved shared React handlers, exported-definition resolution, and
  value/documentation helpers into `@react-docgen/core` while preserving their
  one-purpose-file layout.
- Split TypeScript prop extraction into `typescriptPropsHandler`; kept only
  composed-type, props-member, TypeScript-type, and TypeScript-name helpers in
  `@react-docgen/typescript`.
- Made method extraction accept an optional type resolver, allowing core and
  Babel to handle JavaScript/JSDoc while TypeScript supplies `getTSType`.
- Added Babel's preconfigured `parse()` and changed differential tests to use
  public Babel and TypeScript APIs, removing their implementation dependency.
- Reason: parser adapters now select syntax while core owns shared observable
  React behavior; new adapters need only contribute language-specific logic.

### 2026-08-16 — Initial roadmap

- Added parser-neutral package architecture and six delivery milestones.
- Chose TypeScript as first adapter to validate the smallest useful vertical
  slice before adding Hermes.
- Chose an owned minimal path/traversal/scope layer because react-docgen needs
  only a subset of general AST tooling and has custom type-binding behavior.
- Chose a breaking parser-neutral `react-docgen` major so new APIs do not
  preserve Babel types indefinitely.
- Deferred detailed normalized node schemas, router fallback rules, and parser
  capability matrices until a real milestone needs them; defining them now would
  be speculative.

### 2026-08-16 — Reused existing golden harness

- Replaced planned new golden-output infrastructure with the existing
  integration snapshot suite.
- Added explicit fixture capability metadata and a guard that fails when a new
  fixture is not classified.
- Reason: existing snapshots already capture the compatibility contract; a
  second harness would duplicate behavior and maintenance.

### 2026-08-16 — Deferred caller-shaped contracts

- Moved concrete normalized node fields and `Handler`/`Resolver` contracts from
  the core-foundation milestone to their first TypeScript vertical-slice
  callers.
- Kept only the generic node, path, traversal, scope, parser, file, project, and
  importer mechanics in Milestone 1.
- Reason: defining adapter and extraction shapes before a real caller would
  create speculative API surface.

### 2026-08-16 — Separated implementation from publication

- Changed the Milestone 2 exit criterion from publishing experimental packages
  to making them publish-ready.
- Added public package metadata while leaving the actual npm release as a
  separate explicit action.
- Reason: publishing is an external, irreversible release decision and is not
  implied by implementing the milestone.

### 2026-08-16 — Hardened portable integration corpus before Milestone 3

- Paused Milestone 3 to move 49 legacy fixtures and golden outputs into
  `@react-docgen-internal/integration-tests`, grouped by language and behavior.
- Replaced parser capability metadata with language directories and added a
  validating dependency-free loader.
- Added coverage-driven public behavior cases and a TypeScript adapter
  allowlist; the legacy package remains the complete reference runner.
- Started disabled unit-test dispositions in the corpus audit and expanded
  integration-only coverage from 71.33% to 79.28% statements.
- Reason: parser implementations need one portable observable-output contract;
  unit tests tied to Babel paths cannot provide that contract.

### 2026-08-16 — Reopened coverage expansion

- Removed the initial 79/68/89/79 thresholds and withdrew the claimed behavioral
  plateau.
- Kept 92% coverage from the complete unit-and-integration suite as the
  practical reachability benchmark for the integration corpus.
- Reason: the earlier audit classified broad utility groups too aggressively;
  the existing unit suite proves substantially more production code is
  reachable.

### 2026-08-16 — Established default-parse coverage plateau

- Expanded the corpus to 79 cases and reached 84.05% statements, 74.06%
  branches, 94.62% functions, and 84.61% lines without production changes.
- Set integer-floor thresholds at 84/74/94/84 after the final batch gained only
  0.20 statement points and remaining regions were classified by reachability.
- Explained the difference from the former 92% combined suite: unit tests cover
  custom resolvers, directly exported helpers, and synthetic invalid AST states
  excluded from the default parser corpus.

### 2026-08-16 — Converted internal tooling packages

- Converted `@react-docgen-internal/integration-tests` from handwritten MJS plus
  declarations to a compiled TypeScript package.
- Moved `@react-docgen-internal/benchmark` from the workspace root to
  `packages/benchmark` and updated workspace, Renovate, lint, lockfile, and
  runtime paths.
- Reason: internal packages now follow the same workspace layout and TypeScript
  build conventions as the parser packages.

### 2026-08-16 — Recorded separate coverage contracts

- Recorded 84.05/74.06/94.62/84.61 as the portable default-parse integration
  baseline and 95.03/88.78/98.41/95.45 as the complete unit-and-integration
  baseline.
- Kept integration thresholds tied to the portable corpus rather than raising
  them to complete-suite values.
- Reason: unit tests additionally cover Babel-specific internals, public helper
  APIs, custom resolvers, and synthetic AST states that parser adapters should
  not need to reproduce through integration fixtures.

### 2026-08-16 — Completed JavaScript and TypeScript parity milestone

- Expanded `@react-docgen/typescript` from the vertical slice to the complete
  applicable JavaScript and TypeScript corpus: exports, stable resolver errors,
  local/imported values and types, PropTypes, contexts, defaults, classes,
  methods, docblocks, HOCs, imperative handles, and TypeScript type shapes.
- Kept extraction utilities in one-purpose files and added focused tests for new
  resolution, type, docblock, class, enum, expression, and method helpers.
- Added parser-neutral `createDocgen()` composition to `@react-docgen/core` and
  compile/runtime-tested custom `Parser`, `Resolver`, `Handler`, and `Importer`
  contracts without Babel types.
- Added `@react-docgen/babel`, which normalizes Babel 7/8 AST node names into
  the shared representation and declares both Babel majors as peer ranges.
  Differential tests now require all 40 portable JavaScript golden outputs to
  agree between normalized Babel and TypeScript ESTree.
- Excluded only `typescript/imports/reexported-default-values` from the
  TypeScript adapter. Its support file uses Babel's nonstandard
  `export defaultFrom` proposal, which TypeScript ESTree rejects before an
  importer can expose its values; the same observable import/value behavior is
  covered by standard-syntax import fixtures.
- Reason: Milestone 3's contract is observable output parity for syntax a
  selected parser supports, plus explicit parser boundaries—not emulation of
  another parser's proposal syntax.
