import { describe, expect, test } from 'vitest';
import { loadIntegrationCases } from '@react-docgen-internal/integration-tests';
import { parse, makeFsImporter } from '../../src/main';

describe('integration', () => {
  test.each([
    ['/** child */', 'child'],
    ['', 'parent'],
  ])(
    'uses an overriding property description when present: %s',
    (comment, expected) => {
      const result = parse(
        `interface Parent { /** parent */ value: any; }
       interface Props extends Parent { ${comment} value: string; }
       export default function Example(props: Props) { return <div />; }`,
        { babelOptions: { filename: 'inherited.tsx', babelrc: false } },
      );

      expect(result[0]?.props?.value).toMatchObject({
        description: expected,
        tsType: { name: 'string' },
      });
    },
  );

  test('preserves a propTypes description over inherited type comments', () => {
    const result = parse(
      `import PropTypes from 'prop-types';
       interface Parent { /** parent */ value: any; }
       interface Props extends Parent { /** child */ value: string; }
       export default function Example(props: Props) { return <div />; }
       Example.propTypes = { /** runtime */ value: PropTypes.string };`,
      { babelOptions: { filename: 'inherited.tsx', babelrc: false } },
    );

    expect(result[0]?.props?.value?.description).toBe('runtime');
  });

  test('uses the overriding description after a Flow type spread', () => {
    const result = parse(
      `type Parent = { /** parent */ value: any };
       type Props = { ...Parent, /** child */ value: string };
       export default function Example(props: Props) { return <div />; }`,
      { babelOptions: { filename: 'inherited.js', babelrc: false } },
    );

    expect(result[0]?.props?.value).toMatchObject({
      description: 'child',
      flowType: { name: 'string' },
    });
  });

  for (const integrationCase of loadIntegrationCases()) {
    test(integrationCase.id, () => {
      const run = () =>
        parse(integrationCase.source, {
          importer: makeFsImporter(),
          babelOptions: {
            filename: integrationCase.filename,
            babelrc: false,
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
