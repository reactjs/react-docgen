import type { Importer } from '.';

const ignoreImports: Importer = function (): null {
  return null;
};

// Needs to be a factory because it has to be the exact same API as makeFsImport as
// we replace makeFsImport in browsers with this file
export default () => ignoreImports;
