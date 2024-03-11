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
  propDocblockHandler,
  propTypeCompositionHandler,
  propTypeHandler,
} from './handlers/index.js';
import type { Importer } from './importer/index.js';
import { fsImporter } from './importer/index.js';
import type { Resolver } from './resolver/index.js';
import {
  ChainResolver,
  FindAnnotatedDefinitionsResolver,
  FindExportedDefinitionsResolver,
} from './resolver/index.js';

interface Features {
  resolveEnums?: boolean;
}

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
  experimentalFeatures?: Features;
}
export type InternalConfig = Omit<Required<Config>, 'filename'>;

const defaultResolvers: Resolver[] = [
  new FindExportedDefinitionsResolver({
    limit: 1,
  }),
  new FindAnnotatedDefinitionsResolver(),
];
const defaultResolver: Resolver = new ChainResolver(defaultResolvers, {
  chainingLogic: ChainResolver.Logic.ALL,
});
const defaultImporter: Importer = fsImporter;

export const defaultHandlers: Handler[] = [
  propTypeHandler,
  contextTypeHandler,
  childContextTypeHandler,
  propTypeCompositionHandler,
  propDocblockHandler,
  codeTypeHandler,
  defaultPropsHandler,
  componentDocblockHandler,
  displayNameHandler,
  componentMethodsHandler,
  componentMethodsJsDocHandler,
];

const defaultFeatures: Required<Features> = {
  resolveEnums: false,
};

export function createConfig(inputConfig: Config): InternalConfig {
  const {
    babelOptions,
    filename,
    experimentalFeatures,
    handlers,
    importer,
    resolver,
  } = inputConfig;

  const config = {
    babelOptions: { ...babelOptions },
    handlers: handlers ?? defaultHandlers,
    importer: importer ?? defaultImporter,
    resolver: resolver ?? defaultResolver,
    experimentalFeatures: { ...defaultFeatures, ...experimentalFeatures },
  };

  if (filename) {
    config.babelOptions.filename = filename;
  }

  return config;
}
