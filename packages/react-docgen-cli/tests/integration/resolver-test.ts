import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { ResolverConfigs } from '../../src/commands/parse/options/loadResolvers.js';
import withFixture from './utils/withFixture';

describe('resolver', () => {
  describe('accepts the names of builtin resolver configs', () => {
    test.each(Object.values(ResolverConfigs))('%s', async importer => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          `--resolver=${importer}`,
          `${dir}/Component.js`,
        ]);

        expect(stderr).toBe('');
        expect(stdout).toContain('Component');
        expect(() => JSON.parse(stdout)).not.toThrowError();
      });
    });
  });

  describe('custom resolver', () => {
    describe('function', () => {
      test('accepts an absolute local CommonJS path', async () => {
        await withFixture('custom-resolver-function', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--resolver=${join(dir, 'resolver.cjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local CommonJS path', async () => {
        await withFixture('custom-resolver-function', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver',
            './resolver.cjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts an absolute local ESM path', async () => {
        await withFixture('custom-resolver-function', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--resolver=${join(dir, 'resolver.mjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local ESM path', async () => {
        await withFixture('custom-resolver-function', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver',
            './resolver.mjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a npm package', async () => {
        await withFixture('custom-resolver-function', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver=test-react-docgen-resolver',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });
    });
    describe('class', () => {
      test('accepts an absolute local CommonJS path', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--resolver=${join(dir, 'resolver.cjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local CommonJS path', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver',
            './resolver.cjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts an absolute local ESM path', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            `--resolver=${join(dir, 'resolver.mjs')}`,
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a relative local ESM path', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver',
            './resolver.mjs',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('accepts a npm package', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver=test-react-docgen-resolver',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toBe('');
          expect(stdout).toContain('Custom');
          expect(() => JSON.parse(stdout)).not.toThrowError();
        });
      });

      test('throws if export is not a class instance', async () => {
        await withFixture('custom-resolver-class', async ({ dir, run }) => {
          const { stdout, stderr } = await run([
            '--resolver=test-react-docgen-resolver-class',
            `${dir}/Component.js`,
          ]);

          expect(stderr).toContain(
            "The provided resolver 'test-react-docgen-resolver-class' is not a function or a class instance but instead a class",
          );
          expect(stdout).toBe('');
        });
      });
    });

    test('throws error when not found', async () => {
      await withFixture('basic', async ({ dir, run }) => {
        const { stdout, stderr } = await run([
          '--resolver=does-not-exist',
          `${dir}/Component.js`,
        ]);

        expect(stderr).toContain('Unknown resolver: "does-not-exist"');
        expect(stdout).toBe('');
      });
    });
  });
});
