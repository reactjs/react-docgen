import fs from 'fs';
import { dirname, join } from 'path';
import { describe, expect, test } from 'vitest';
import { parse, makeFsImporter } from '../../src/main';
import { fileURLToPath } from 'url';

describe('integration', () => {
  test('extracts props from the builtin Readonly wrapper', () => {
    const result = parse(
      `interface Props {
        /** The displayed label. */
        label: string;
        disabled?: boolean;
      }
      export default function Example(props: Readonly<Props>) {
        return <div>{props.label}</div>;
      }`,
      { babelOptions: { filename: 'readonly.tsx', babelrc: false } },
    );

    expect(result[0]?.props).toMatchObject({
      label: {
        required: true,
        tsType: { name: 'string' },
        description: 'The displayed label.',
      },
      disabled: { required: false, tsType: { name: 'boolean' } },
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
