import fs from 'fs';
import { dirname, join } from 'path';
import { describe, expect, test } from 'vitest';
import { parse, makeFsImporter } from '../../src/main';
import { fileURLToPath } from 'url';

describe('integration', () => {
  describe('fixtures', () => {
    const fixturePath = join(
      dirname(fileURLToPath(import.meta.url)),
      '__fixtures__',
    );
    const fileNames = fs.readdirSync(fixturePath, { withFileTypes: true });

    for (let i = 0; i < fileNames.length; i++) {
      if (fileNames[i].isDirectory()) {
        continue;
      }
      const name = fileNames[i].name;

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
        }).not.toThrowError();
        expect(result).toMatchSnapshot();
      });
    }
  });
});
