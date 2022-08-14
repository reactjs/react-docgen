import * as allHandlers from './handlers';
import parse from './parse';
import * as allResolvers from './resolver';
import * as allImporters from './importer';
import * as utils from './utils';
import type { DocumentationObject as Documentation } from './Documentation';
import type { Resolver } from './resolver';
import type { Importer } from './importer';
import type { Handler } from './handlers';
import type FileState from './FileState';
import type { Config } from './config';
import { createConfig, defaultHandlers } from './config';

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
  defaultParse as parse,
  defaultHandlers,
  allHandlers as handlers,
  allResolvers as resolver,
  allImporters as importers,
  utils,
};

export type { Importer, Handler, Resolver, FileState, Config, Documentation };
