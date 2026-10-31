import { relative } from 'path';
import chalk from 'chalk';

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
  let color = chalk.yellow;
  let log = console.warn;
  let isError = false;

  if (failOnWarning && isReactDocgenError(error)) {
    process.exitCode = 2;
    isError = true;
    label = 'ERROR';
    color = chalk.red;
    log = console.error;
  }

  log(
    color(
      `▶ ${label}: ${error.message} 👀\n  in ${chalk.underline(
        relative(process.cwd(), filePath),
      )}\n`,
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
  } else {
    process.exitCode = 1;
    console.error(error);

    return true;
  }
}
