import { readFile } from 'fs/promises';
import { join } from 'path';
import { temporaryFile } from 'tempy';
import { describe, expect, test } from 'vitest';
import { builtinHandlers, builtinImporters } from 'react-docgen';
import withFixture from './utils/withFixture';

describe('cli', () => {
  describe('glob', () => {
    test('reads files provided as command line arguments', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          join(dir, `Component.js`),
          join(dir, `NoComponent.js`),
        ]);

        expect(stderr).toContain('NoComponent.js');
        expect(stdout).toContain('Component.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('reads absolute globs provided as command line arguments', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([`${dir}/*`]);

        expect(stderr).toContain('NoComponent.js');
        expect(stdout).toContain('Component.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('reads relative globs provided as command line arguments', async () => {
      await withFixture('basic', async ({ run }) => {
        const { stdout, stderr } = await run(['./*']);

        expect(stderr).toContain('NoComponent.js');
        expect(stdout).toContain('Component.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });
  });

  describe('ignore', () => {
    test('ignores files in node_modules, __tests__ and __mocks__ by default', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run([`${dir}/**/*`]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('MockComponent.js');
        expect(stdout).not.toContain('TestComponent.js');
        expect(stdout).not.toContain('NodeModulesComponent.js');
        expect(stdout).toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('can disable default ignores', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '--no-default-ignores',
          `${dir}/**/*`,
        ]);

        expect(stderr).toBe('');
        expect(stdout).toContain('MockComponent.js');
        expect(stdout).toContain('TestComponent.js');
        expect(stdout).toContain('NodeModulesComponent.js');
        expect(stdout).toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('ignores directory defined by glob starting with star', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '--ignore=**/foo/**',
          `${dir}/**/*`,
        ]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('MockComponent.js');
        expect(stdout).not.toContain('TestComponent.js');
        expect(stdout).not.toContain('NodeModulesComponent.js');
        expect(stdout).not.toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('ignores directory defined by relative path', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '--ignore',
          './foo/**',
          `${dir}/**/*`,
        ]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('MockComponent.js');
        expect(stdout).not.toContain('TestComponent.js');
        expect(stdout).not.toContain('NodeModulesComponent.js');
        expect(stdout).not.toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('ignores directory with shortcut defined by glob starting with star', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '-i',
          '**/foo/**',
          `${dir}/**/*`,
        ]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('MockComponent.js');
        expect(stdout).not.toContain('TestComponent.js');
        expect(stdout).not.toContain('NodeModulesComponent.js');
        expect(stdout).not.toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('ignores directory with shortcut defined by relative path', async () => {
      await withFixture('ignore', async ({ dir, run }) => {
        const { stdout, stderr } = await run(['-i', './foo/**', `${dir}/**/*`]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('MockComponent.js');
        expect(stdout).not.toContain('TestComponent.js');
        expect(stdout).not.toContain('NodeModulesComponent.js');
        expect(stdout).not.toContain('FooComponent.js');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });
  });

  describe('out', () => {
    test('writes to a file if provided', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const outFile = temporaryFile();
        const { stdout, stderr } = await run([
          `--out=${outFile}`,
          `${dir}/Component.js`,
        ]);

        const writtenResult = await readFile(outFile, 'utf-8');

        expect(stderr).toBe('');
        expect(writtenResult.length).toBeGreaterThan(4);
        expect(() => JSON.parse(writtenResult)).not.toThrowError();
        expect(stdout).toBe('');
      });
    });

    test('writes to a file if provided shortcut', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const outFile = temporaryFile();
        const { stdout, stderr } = await run([
          '-o',
          outFile,
          `${dir}/Component.js`,
        ]);

        const writtenResult = await readFile(outFile, 'utf-8');

        expect(stderr).toBe('');
        expect(writtenResult.length).toBeGreaterThan(4);
        expect(() => JSON.parse(writtenResult)).not.toThrowError();
        expect(stdout).toBe('');
      });
    });
  });

  describe('importer', () => {
    describe('accepts the names of builtin importers', () => {
      test.each(Object.keys(builtinImporters))('%s', async importer => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--importer=${importer}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Component');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });
    });

    describe('custom importer', () => {
      test('accepts an absolute local CommonJS path', async () => {
        await withFixture('custom-importer-cjs', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--importer=${join(dir, 'importer.cjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"importer"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local CommonJS path', async () => {
        await withFixture('custom-importer-cjs', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--importer',
            './importer.cjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"importer"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts an absolute local ESM path', async () => {
        await withFixture('custom-importer-esm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--importer=${join(dir, 'importer.mjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"importer"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local ESM path', async () => {
        await withFixture('custom-importer-esm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--importer',
            './importer.mjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"importer"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a npm package', async () => {
        await withFixture('custom-importer-npm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--importer=test-react-docgen-importer',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"importer"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('throws error when not found', async () => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--importer=does-not-exist',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toContain('Unknown importer: "does-not-exist"');
          expect(stdout).toBe('');
        });
      });
    });
  });

  describe('handlers', () => {
    describe('accepts the names of builtin handlers', () => {
      test.each(Object.keys(builtinHandlers))('%s', async importer => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--handler=${importer}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Component');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });
    });

    describe('multiple handlers', () => {
      test('multiple handlers arguments', async () => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--handler=displayNameHandler`,
            `--handler=componentDocblockHandler`,
            `--handler=componentMethodsHandler`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"Component"');
          expect(stdout).toContain('"description":""');
          expect(stdout).toContain('"name":"otherMethod"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('multiple handlers comma separated', async () => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--handler=displayNameHandler,componentDocblockHandler,componentMethodsHandler`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"Component"');
          expect(stdout).toContain('"description":""');
          expect(stdout).toContain('"name":"otherMethod"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });
    });

    describe('custom handlers', () => {
      test('accepts an absolute local CommonJS path', async () => {
        await withFixture('custom-handler-cjs', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--handler=${join(dir, 'handler.cjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"testhandler"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local CommonJS path', async () => {
        await withFixture('custom-handler-cjs', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--handler',
            './handler.cjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"testhandler"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts an absolute local ESM path', async () => {
        await withFixture('custom-handler-esm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--handler=${join(dir, 'handler.mjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"testhandler"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local ESM path', async () => {
        await withFixture('custom-handler-esm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--handler',
            './handler.mjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"testhandler"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a npm package', async () => {
        await withFixture('custom-handler-npm', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--handler=test-react-docgen-handler',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('"displayName":"testhandler"');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('throws error when not found', async () => {
        await withFixture('basic', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--handler=does-not-exist',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toContain('Unknown handler: "does-not-exist"');
          expect(stdout).toBe('');
        });
      });
    });
  });

  describe('pretty', () => {
    test('by default does not prettify output', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([join(dir, `Component.js`)]);

        expect(stderr).toBe('');
        expect(stdout).not.toContain('\n');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });

    test('does prettify output', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '--pretty',
          join(dir, `Component.js`),
        ]);

        expect(stderr).toBe('');
        expect(stdout).toContain('\n');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });
  });

  describe('error', () => {
    test('does exit with code 2 on warning', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr, exitCode } = await run([
          '--failOnWarning',
          `${dir}/*`,
        ]);

        expect(stderr).toContain('NoComponent');
        expect(stdout).toEqual('');
        expect(exitCode).toBe(2);
      });
    });
  });
});
