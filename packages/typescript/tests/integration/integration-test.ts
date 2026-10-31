import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse } from '../../src/index.js';

const supportedCases = [
  'js/definitions/function-declaration',
  'js/definitions/annotated-function',
  'js/definitions/custom-base-class-render',
  'js/definitions/configured-nested-hoc',
  'js/definitions/hoc-wrapped-component',
  'js/definitions/class-expression-static-assignments',
  'js/definitions/assigned-class-invalid-display-name',
  'js/definitions/numeric-display-name',
  'js/definitions/display-name-resolution',
  'js/definitions/react-create-class-assignment',
  'js/definitions/react-create-class-variable',
  'js/exports/commonjs-named',
  'js/exports/commonjs-module',
  'js/exports/computed-commonjs',
  'js/errors/missing-definition',
  'js/errors/multiple-definitions',
  'js/defaults/memo-forward-ref',
  'js/defaults/destructured-bindings',
  'js/defaults/function-default-props',
  'js/defaults/value-serialization',
  'js/defaults/computed-property',
  'js/defaults/spreads-and-parameters',
  'js/defaults/unresolved-enum',
  'js/props/all-proptypes',
  'js/props/package-proptypes-context',
  'js/props/react-proptypes-context',
  'js/props/shape-exact-and-union',
  'js/props/composed-and-custom-validators',
  'js/props/literal-computed-keys',
  'js/props/nested-shape-inheritance',
  'js/props/object-key-and-value-enums',
  'js/methods/class-methods',
  'js/methods/class-method-documentation',
  'js/methods/jsdoc-variants',
  'js/methods/parameter-shapes',
  'js/methods/imperative-handle',
  'js/methods/imperative-handle-callbacks',
  'js/methods/imperative-handle-callback-guards',
  'js/regressions/class-static-getters',
  'js/imports/export-star-chain',
  'js/imports/imported-defaults-and-enums',
  'js/imports/member-proptypes',
  'js/imports/namespace-reexport',
  'js/imports/reexported-proptypes',
  'js/imports/spread-proptypes',
  'typescript/defaults/function-default-parameters',
  'typescript/defaults/forward-ref-parameter-default',
  'typescript/definitions/anonymous-default-class',
  'typescript/exports/namespace-reexport',
  'typescript/types/comprehensive-props',
  'typescript/types/nested-object-and-union',
  'typescript/types/type-alias-intersection',
  'typescript/types/interface-composition',
  'typescript/types/react-prop-wrappers',
  'typescript/types/advanced-props',
  'typescript/types/indexed-access-constant',
  'typescript/types/generic-interface-extension',
  'typescript/methods/class-methods',
  'typescript/methods/modifiers-and-types',
  'typescript/methods/imperative-handle-callbacks',
  'typescript/regressions/circular-interface-inheritance',
  'typescript/regressions/circular-type-aliases',
  'typescript/regressions/polymorphic-forward-ref',
  'typescript/imports/extended-props',
  'typescript/imports/imported-props',
];

describe('integration', () => {
  for (const integrationCase of loadIntegrationCases({
    ids: supportedCases,
  })) {
    test(integrationCase.id, () => {
      const run = () =>
        parse(integrationCase.source, {
          filename: integrationCase.filename,
          importer(specifier, fromFilename) {
            const base = path.resolve(path.dirname(fromFilename), specifier);
            const extensionless = base.replace(/\.[^./]+$/, '');
            const filename = [
              base,
              `${extensionless}.js`,
              `${extensionless}.jsx`,
              `${extensionless}.ts`,
              `${extensionless}.tsx`,
            ].find((candidate) => fs.existsSync(candidate));

            if (!filename) throw new Error(`Cannot resolve ${specifier}.`);

            return { code: fs.readFileSync(filename, 'utf8'), filename };
          },
        });

      if (integrationCase.error) {
        expect(run).toThrow(
          expect.objectContaining({ code: integrationCase.error.code }),
        );
      } else {
        expect(run()).toEqual(integrationCase.output);
      }
    });
  }
});
