import fs from 'fs';
import path from 'path';
import { parse, importers } from '../../src/main';

describe('integration', () => {
  describe('fixtures', () => {
    const fixturePath = path.join(__dirname, '__fixtures__');
    const fileNames = fs.readdirSync(fixturePath, { withFileTypes: true });

    for (let i = 0; i < fileNames.length; i++) {
      if (fileNames[i].isDirectory()) {
        continue;
      }
      const name = fileNames[i].name;

      const filePath = path.join(fixturePath, name);
      const fileContent = fs.readFileSync(filePath, 'utf8');

      it(`processes component "${name}" without errors`, () => {
        let result;

        expect(() => {
          result = parse(fileContent, {
            importer: importers.makeFsImporter(),
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
