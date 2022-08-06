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
 * See `parse.js` for more information about the arguments. This function
 * simply sets default values for convenience.
 *
 * The default resolver looks for *exported* `React.createClass(def)` calls
 * and expected `def` to resolve to an object expression.
 *
 * The default `handlers` look for `propTypes` and `getDefaultProps` in the
 * provided object expression, and extract prop type information, prop
 * documentation (from docblocks), default prop values and component
 * documentation (from a docblock).
 * TODO jsdoc
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
