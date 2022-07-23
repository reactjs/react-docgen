import * as allHandlers from './handlers';
import parse from './parse';
import * as AllResolver from './resolver';
import * as AllImporter from './importer';
import * as utils from './utils';
import type { Options } from './babelParser';
import type { DocumentationObject as Documentation } from './Documentation';
import type { Resolver } from './resolver';
import type { Importer } from './importer';
import type { Handler } from './handlers';
import type FileState from './FileState';

const defaultResolver: Resolver = AllResolver.findExportedComponentDefinition;
const defaultHandlers: Handler[] = [
  allHandlers.propTypeHandler,
  allHandlers.contextTypeHandler,
  allHandlers.childContextTypeHandler,
  allHandlers.propTypeCompositionHandler,
  allHandlers.propDocBlockHandler,
  allHandlers.flowTypeHandler,
  allHandlers.defaultPropsHandler,
  allHandlers.componentDocblockHandler,
  allHandlers.displayNameHandler,
  allHandlers.componentMethodsHandler,
  allHandlers.componentMethodsJsDocHandler,
];
const defaultImporter: Importer = AllImporter.makeFsImporter();

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
 */
function defaultParse(
  src: Buffer | string,
  resolver: Resolver = defaultResolver,
  handlers: Handler[] = defaultHandlers,
  importer: Importer = defaultImporter,
  // Used for backwards compatibility of this method
  options: Options = {},
): Documentation | Documentation[] {
  return parse(String(src), resolver, handlers, importer, options);
}

export {
  defaultParse as parse,
  defaultHandlers,
  allHandlers as handlers,
  AllResolver as resolver,
  AllImporter as importers,
  utils,
};

export type { Importer, Handler, Resolver, FileState, Options, Documentation };
