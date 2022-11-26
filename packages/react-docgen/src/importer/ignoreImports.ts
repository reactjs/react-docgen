import type { Importer } from '.';

const ignoreImports: Importer = function (): null {
  return null;
};

export default ignoreImports;
