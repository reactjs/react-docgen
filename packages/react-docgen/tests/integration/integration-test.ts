import fs from 'fs';
import { dirname, join } from 'path';
import { describe, expect, test } from 'vitest';
import { parse, makeFsImporter } from '../../src/main';
import { fileURLToPath } from 'url';

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

  describe('fixtures', () => {
    const fixturePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '__fixtures__',
    );
    const fileNames = fs.readdirSync(fixturePath, { withFileTypes: true });

    for (const entry of fileNames) {
      if (entry.isDirectory()) {
        continue;
      }
      const name = entry.name;

      const filePath = join(fixturePath, name);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      test(`processes component "${name}" without errors`, () => {
        let result;

        expect(() => {
          result = parse(fileContent, {
            importer: makeFsImporter(),
            babelOptions: {
              filename: filePath,
              babelrc: false,
            },
          });
        }).not.toThrow();
        expect(result).toMatchSnapshot();
      });
    }
  });
});
