import { resolve } from 'path';
import importFile from '../../../utils/importFile.js';

export default async function loadReactDocgenPlugin<T>(
  input: string,
  name: string,
  builtins?: Record<string, T>,
): Promise<T> {
  const builtin = builtins?.[input];

  if (builtin !== undefined) {
    return builtin;
  }

  const path = resolve(process.cwd(), input);
  // Maybe it is local path or a package
  const plugin: T | undefined =
    (await importFile(path)) ?? (await importFile(input));

  if (plugin) {
    return plugin;
  }

  throw new Error(
    `Unknown ${name}: "${input}" is not a built-in ${name}, ` +
      `not a package, and can not be found locally ("${path}")`,
  );
}
