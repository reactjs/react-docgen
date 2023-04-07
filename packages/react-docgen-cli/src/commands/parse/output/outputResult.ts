import { writeFile } from 'fs/promises';
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
    await writeFile(output, result, 'utf-8');
  } else {
    process.stdout.write(result + '\n');
  }
}
