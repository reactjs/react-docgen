import { join } from 'path';
import { describe, expect, test } from 'vitest';
import { builtinHandlers } from 'react-docgen';
import withFixture from './utils/withFixture';

describe('handler', () => {
  describe('accepts the names of builtin handlers', () => {
    test.each(Object.keys(builtinHandlers))('%s', async (importer) => {
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
