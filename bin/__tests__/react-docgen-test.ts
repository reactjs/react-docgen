// NOTE: This test spawns a subprocesses that load the files from lib/, not
// src/. Before running this test run `npm run build` or `npm run watch`.

const TEST_TIMEOUT = 120000;

import fs, { promises } from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import { directory as tempDirectory, file as tempFile } from 'tempy';
import spawn from 'cross-spawn';

const { writeFile, mkdir } = promises;

function run(
  args: readonly string[],
  stdin: Buffer | string | null = null,
): Promise<[string, string]> {
  return new Promise(resolve => {
    const docgen = spawn(path.join(__dirname, '../react-docgen.js'), args);
    let stdout = '';
    let stderr = '';
    docgen.stdout?.on('data', data => (stdout += data));
    docgen.stderr?.on('data', data => (stderr += data));
    docgen.on('close', () => resolve([stdout, stderr]));
    docgen.on('error', e => {
      throw e;
    });
    if (stdin) {
      docgen.stdin?.write(stdin);
    }
    docgen.stdin?.end();
  });
}

const component = fs.readFileSync(
  path.join(__dirname, '__fixtures__/Component.js'),
);

describe('react-docgen CLI', () => {
  let tempDir = '';
  let tempComponents: string[] = [];
  let tempNoComponents: string[] = [];

  async function createTempfiles(
    extension = 'js',
    dir: string | null = null,
  ): Promise<string> {
    if (!tempDir) {
      tempDir = tempDirectory();
    }

    if (!dir) {
      dir = tempDir;
    } else {
      dir = path.join(tempDir, dir);
      try {
        await mkdir(dir);
      } catch (error: any) {
        if (error.message.indexOf('EEXIST') === -1) {
          throw error;
        }
      }
    }

    const componentPath = path.join(dir, `Component.${extension}`);
    await writeFile(componentPath, component, 'utf-8');
    tempComponents.push(componentPath);

    const noComponentPath = path.join(dir, `NoComponent.${extension}`);
    await writeFile(noComponentPath, '{}', 'utf-8');
    tempNoComponents.push(noComponentPath);

    return dir;
  }

  afterEach(() => {
    if (tempDir) {
      rimraf.sync(tempDir);
    }
    tempDir = '';
    tempComponents = [];
    tempNoComponents = [];
  }, TEST_TIMEOUT);

  it(
    'reads from stdin',
    async () => {
      return run([], component).then(([stdout, stderr]) => {
        expect(stdout).not.toBe('');
        expect(stderr).toBe('');
      });
    },
    TEST_TIMEOUT,
  );

  it(
    'reads files provided as command line arguments',
    async () => {
      await createTempfiles();
      const [stdout, stderr] = await run(
        tempComponents.concat(tempNoComponents),
      );

      expect(stdout).toContain('Component');
      expect(stderr).toContain('NoComponent');
    },
    TEST_TIMEOUT,
  );

  it(
    'reads directories provided as command line arguments',
    async () => {
      await createTempfiles();
      const [stdout, stderr] = await run([tempDir]);
      expect(stderr).toContain('NoComponent');
      expect(stdout).toContain('Component');
    },
    TEST_TIMEOUT,
  );

  it(
    'considers js and jsx by default',
    async () => {
      await createTempfiles();
      await createTempfiles('jsx');
      await createTempfiles('foo');
      const [stdout, stderr] = await run([tempDir]);

      expect(stdout).toContain('Component.js');
      expect(stdout).toContain('Component.jsx');
      expect(stdout).not.toContain('Component.foo');

      expect(stderr).toContain('NoComponent.js');
      expect(stderr).toContain('NoComponent.jsx');
      expect(stderr).not.toContain('NoComponent.foo');
    },
    TEST_TIMEOUT,
  );

  it(
    'considers files with the specified extension',
    async () => {
      await createTempfiles('foo');
      await createTempfiles('bar');

      const [stdout, stderr] = await run([
        '--extension=foo',
        '--extension=bar',
        tempDir,
      ]);
      expect(stdout).toContain('Component.foo');
      expect(stdout).toContain('Component.bar');

      expect(stderr).toContain('NoComponent.foo');
      expect(stderr).toContain('NoComponent.bar');
    },
    TEST_TIMEOUT,
  );

  it(
    'considers files with the specified extension shortcut',
    async () => {
      await createTempfiles('foo');
      await createTempfiles('bar');

      const [stdout, stderr] = await run(['-x', 'foo', '-x', 'bar', tempDir]);

      expect(stdout).toContain('Component.foo');
      expect(stdout).toContain('Component.bar');

      expect(stderr).toContain('NoComponent.foo');
      expect(stderr).toContain('NoComponent.bar');
    },
    TEST_TIMEOUT,
  );

  it(
    'ignores files in node_modules, __tests__ and __mocks__ by default',
    async () => {
      await createTempfiles(undefined, 'node_modules');
      await createTempfiles(undefined, '__tests__');
      await createTempfiles(undefined, '__mocks__');

      const [stdout, stderr] = await run([tempDir]);

      expect(stdout).toBe('');
      expect(stderr).toBe('');
    },
    TEST_TIMEOUT,
  );

  it(
    'ignores specified folders',
    async () => {
      await createTempfiles(undefined, 'foo');

      const [stdout, stderr] = await run(['--ignore=foo', tempDir]);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    },
    TEST_TIMEOUT,
  );

  it(
    'ignores specified folders shortcut',
    async () => {
      await createTempfiles(undefined, 'foo');

      const [stdout, stderr] = await run(['-i', 'foo', tempDir]);
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    },
    TEST_TIMEOUT,
  );

  it(
    'writes to stdout',
    async () => {
      const [stdout, stderr] = await run([], component);
      expect(stdout.length > 0).toBe(true);
      expect(stderr.length).toBe(0);
    },
    TEST_TIMEOUT,
  );

  it(
    'writes to stderr',
    async () => {
      const [stdout, stderr] = await run([], '{}');
      expect(stderr.length > 0).toBe(true);
      expect(stdout.length).toBe(0);
    },
    TEST_TIMEOUT,
  );

  it(
    'writes to a file if provided',
    async () => {
      const outFile = tempFile();
      await createTempfiles();

      const [stdout] = await run([`--out=${outFile}`, tempDir]);

      expect(fs.readFileSync(outFile)).not.toBe('');
      expect(stdout).toBe('');
    },
    TEST_TIMEOUT,
  );

  it(
    'writes to a file if provided shortcut',
    async () => {
      const outFile = tempFile();
      await createTempfiles();

      const [stdout] = await run(['-o', outFile, tempDir]);

      expect(fs.readFileSync(outFile)).not.toBe('');
      expect(stdout).toBe('');
    },
    TEST_TIMEOUT,
  );

  describe('--resolver', () => {
    describe('accepts the names of built in resolvers', () => {
      it(
        'findExportedComponentDefinition (default)',
        async () => {
          // No option passed: same as --resolver=findExportedComponentDefinition
          const [stdout] = await run([
            path.join(__dirname, '__fixtures__/Component.js'),
          ]);

          expect(stdout).toContain('Component');
        },
        TEST_TIMEOUT,
      );

      it(
        'findExportedComponentDefinition',
        async () => {
          const [stdout] = await run([
            '--resolver=findExportedComponentDefinition',
            path.join(__dirname, '__fixtures__/Component.js'),
          ]);

          expect(stdout).toContain('Component');
        },
        TEST_TIMEOUT,
      );

      it(
        'findAllComponentDefinitions',
        async () => {
          const [stdout] = await run([
            '--resolver=findAllComponentDefinitions',
            path.join(__dirname, '__fixtures__/MultipleComponents.js'),
          ]);

          expect(stdout).toContain('ComponentA');
          expect(stdout).toContain('ComponentB');
        },
        TEST_TIMEOUT,
      );

      it(
        'findAllExportedComponentDefinitions',
        async () => {
          const [stdout] = await run([
            '--resolver=findAllExportedComponentDefinitions',
            path.join(__dirname, '__fixtures__/MultipleComponents.js'),
          ]);

          expect(stdout).toContain('ComponentA');
          expect(stdout).toContain('ComponentB');
        },
        TEST_TIMEOUT,
      );
    });

    it(
      'accepts a path to a resolver function',
      async () => {
        const [stdout] = await run([
          `--resolver=${path.join(
            __dirname,
            '__fixtures__/customResolver.js',
          )}`,
          path.join(__dirname, '__fixtures__/MultipleComponents.js'),
        ]);

        expect(stdout).toContain('Custom');
      },
      TEST_TIMEOUT,
    );
  });

  describe('--exclude/-e', () => {
    it(
      'ignores files by name',
      async () => {
        await createTempfiles(undefined, 'foo');
        await createTempfiles(undefined, 'bar');

        const [stdout, stderr] = await run([
          '--exclude=Component.js',
          '--exclude=NoComponent.js',
          tempDir,
        ]);

        expect(stdout).toBe('');
        expect(stderr).toBe('');
      },
      TEST_TIMEOUT,
    );

    it(
      'ignores files by name shortcut',
      async () => {
        await createTempfiles(undefined, 'foo');
        await createTempfiles(undefined, 'bar');

        const [stdout, stderr] = await run([
          '-e',
          'Component.js',
          '-e',
          'NoComponent.js',
          tempDir,
        ]);

        expect(stdout).toBe('');
        expect(stderr).toBe('');
      },
      TEST_TIMEOUT,
    );

    it(
      'ignores files by regex',
      async () => {
        await createTempfiles(undefined, 'foo');
        await createTempfiles(undefined, 'bar');

        const [stdout, stderr] = await run([
          '--exclude=/.*Component\\.js/',
          tempDir,
        ]);

        expect(stdout).toBe('');
        expect(stderr).toBe('');
      },
      TEST_TIMEOUT,
    );

    it(
      'ignores files by regex shortcut',
      async () => {
        await createTempfiles(undefined, 'foo');
        await createTempfiles(undefined, 'bar');

        const [stdout, stderr] = await run([
          '-e',
          '/.*Component\\.js/',
          tempDir,
        ]);

        expect(stdout).toBe('');
        expect(stderr).toBe('');
      },
      TEST_TIMEOUT,
    );
  });
});
