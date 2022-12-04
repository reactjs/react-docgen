import type { Importer } from './index.js';

const ignoreImports: Importer = function (): null {
  return null;
};

export default ignoreImports;
