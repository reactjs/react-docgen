import { rm, cp } from 'fs/promises';
import { dirname, join } from 'path';
import { execaNode } from 'execa';
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
    ) => Promise<{ stdout: string; stderr: string; exitCode?: number }>;
  }) => Promise<void>,
): Promise<void> {
  const tempDir = temporaryDirectory();

  async function run(args: readonly string[]) {
    return execaNode(cliBinary, args, {
      cwd: tempDir,
      lines: false,
      reject: false,
    });
  }

  await cp(join(fixtureDir, fixture), tempDir, { recursive: true });
  await callback({ dir: tempDir, run });
  await rm(tempDir, { force: true, recursive: true });
}
