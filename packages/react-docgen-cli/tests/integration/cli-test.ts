import { readFile } from 'fs/promises';
import { join } from 'path';
import { temporaryFile } from 'tempy';
import { describe, expect, test } from 'vitest';
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
