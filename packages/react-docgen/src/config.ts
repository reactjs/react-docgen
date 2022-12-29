import type { TransformOptions } from '@babel/core';
import type { Handler } from './handlers/index.js';
import {
  childContextTypeHandler,
  codeTypeHandler,
  componentDocblockHandler,
  componentMethodsHandler,
  componentMethodsJsDocHandler,
  contextTypeHandler,
  defaultPropsHandler,
  displayNameHandler,
  propDocBlockHandler,
  propTypeCompositionHandler,
  propTypeHandler,
} from './handlers/index.js';
import type { Importer } from './importer/index.js';
import { fsImporter } from './importer/index.js';
import type { Resolver } from './resolver/index.js';
import { FindExportedDefinitionsResolver } from './resolver/index.js';

export interface Config {
  handlers?: Handler[];
  importer?: Importer;
  resolver?: Resolver;
  /**
   * shortcut for `babelOptions.filename`
   * Set to an absolute path (recommended) to the file currently being parsed or
   * to an relative path that is relative to the `babelOptions.cwd`.
   */
  filename?: string;
  babelOptions?: TransformOptions;
}
export type InternalConfig = Omit<Required<Config>, 'filename'>;

const defaultResolver: Resolver = new FindExportedDefinitionsResolver({
  limit: 1,
});
const defaultImporter: Importer = fsImporter;

export const defaultHandlers: Handler[] = [
  propTypeHandler,
  contextTypeHandler,
  childContextTypeHandler,
  propTypeCompositionHandler,
  propDocBlockHandler,
  codeTypeHandler,
  defaultPropsHandler,
  componentDocblockHandler,
  displayNameHandler,
  componentMethodsHandler,
  componentMethodsJsDocHandler,
];

export function createConfig(inputConfig: Config): InternalConfig {
  const { babelOptions, filename, handlers, importer, resolver } = inputConfig;

  const config = {
    babelOptions: { ...babelOptions },
    handlers: handlers ?? defaultHandlers,
    importer: importer ?? defaultImporter,
    resolver: resolver ?? defaultResolver,
  };

  if (filename) {
    config.babelOptions.filename = filename;
  }

  return config;
}
