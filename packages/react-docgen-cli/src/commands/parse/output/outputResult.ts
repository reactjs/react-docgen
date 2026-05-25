import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { Documentation } from 'react-docgen';

export default async function outputResult(
  documentation: Record<string, Documentation[]>,
  { pretty = false, output }: { pretty: boolean; output: string | undefined },
): Promise<void> {
  const result = JSON.stringify(
    documentation,
    undefined,
    pretty ? 2 : undefined,
  );

  if (output) {
    const resolvedOutput = resolve(output);
    const cwd = resolve('.');
    if (!resolvedOutput.startsWith(cwd)) {
      throw new Error('Output path must be within the current working directory');
    }
    await writeFile(resolvedOutput, result, 'utf-8');
  } else {
    process.stdout.write(result + '\n');
  }
}
