import * as builtinHandlers from './handlers/index.js';
import parse from './parse.js';
import * as builtinResolvers from './resolver/index.js';
import {
  fsImporter,
  ignoreImporter,
  makeFsImporter,
} from './importer/index.js';
import * as utils from './utils/index.js';
import type { DocumentationObject as Documentation } from './Documentation.js';
import type { Resolver } from './resolver/index.js';
import type { Importer } from './importer/index.js';
import type { Handler } from './handlers/index.js';
import type FileState from './FileState.js';
import type { Config } from './config.js';
import { createConfig, defaultHandlers } from './config.js';

const builtinImporters = {
  fsImporter,
  ignoreImporter,
};

declare module '@babel/traverse' {
  export interface HubInterface {
    file: FileState;
    parse: typeof FileState.prototype.parse;
    import: typeof FileState.prototype.import;
  }

  export interface Hub {
    file: FileState;
    parse: typeof FileState.prototype.parse;
    import: typeof FileState.prototype.import;
  }
}

/**
 * Parse the *src* and scan for react components based on the config
 * that gets supplied.
 *
 * The default resolvers look for *exported* react components.
 *
 * By default all handlers are applied, so that all possible
 * different use cases are covered.
 *
 * The default importer is the fs-importer that tries to resolve
 * files based on the nodejs resolve algorithm.
 */
function defaultParse(
  src: Buffer | string,
  config: Config = {},
): Documentation[] {
  const defaultConfig = createConfig(config);

  return parse(String(src), defaultConfig);
}

export {
  builtinHandlers,
  builtinResolvers,
  builtinImporters,
  defaultHandlers,
  makeFsImporter,
  defaultParse as parse,
  utils,
};

export type { Importer, Handler, Resolver, FileState, Config, Documentation };
