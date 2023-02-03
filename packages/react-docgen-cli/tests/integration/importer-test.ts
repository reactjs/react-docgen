import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { builtinImporters } from 'react-docgen';
import withFixture from './utils/withFixture';

describe('importer', () => {
  describe('accepts the names of builtin importers', () => {
    test.each(Object.keys(builtinImporters))('%s', async (importer) => {
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
