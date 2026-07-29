import { relative } from 'node:path';
import { styleText } from 'node:util';

function isReactDocgenError(error: NodeJS.ErrnoException): boolean {
  return Boolean(
    error instanceof Error && error.code?.startsWith('ERR_REACTDOCGEN'),
  );
}

function outputReactDocgenError(
  error: Error,
  filePath: string,
  { failOnWarning }: { failOnWarning: boolean },
): boolean {
  let label = 'WARNING';
  let format: 'red' | 'yellow' = 'yellow';
  let log = console.warn;
  let isError = false;

  if (failOnWarning && isReactDocgenError(error)) {
    process.exitCode = 2;
    isError = true;
    label = 'ERROR';
    format = 'red';
    log = console.error;
  }

  const relativePath = styleText(
    'underline',
    relative(process.cwd(), filePath),
    { stream: process.stderr },
  );

  log(
    styleText(
      format,
      `▶ ${label}: ${error.message} 👀\n  in ${relativePath}\n`,
      { stream: process.stderr },
    ),
  );

  return isError;
}

export default function outputError(
  error: Error,
  filePath: string,
  options: { failOnWarning: boolean },
): boolean {
  if (isReactDocgenError(error)) {
    return outputReactDocgenError(error, filePath, options);
  }

  process.exitCode = 1;
  console.error(error);

  return true;
}
