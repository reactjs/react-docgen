import { rm, stat } from 'fs/promises';
import { dirname, join } from 'path';
import type { ExecaError, ExecaReturnValue } from 'execa';
import { execaNode } from 'execa';
import copy from 'cpy';
import { temporaryDirectory } from 'tempy';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

const fixtureDir = join(__dir, '../__fixtures__');
const cliBinary = join(__dir, '../../../dist/cli.js');

export default async function withFixture(
  fixture: string,
  callback: (api: {
    dir: string;
    run: (
      args: readonly string[],
    ) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  }) => Promise<void>,
): Promise<void> {
  const tempDir = temporaryDirectory();

  async function run(
    args: readonly string[],
  ): Promise<ExecaError | ExecaReturnValue<string>> {
    try {
      return await execaNode(cliBinary, args, {
        cwd: tempDir,
      });
    } catch (error) {
      return error as ExecaError;
    }
  }

  await stat(join(fixtureDir, fixture));

  await copy(join(fixtureDir, fixture, '**/*'), tempDir, {});
  await callback({ dir: tempDir, run });
  await rm(tempDir, { force: true, recursive: true });
}
