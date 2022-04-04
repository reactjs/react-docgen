import * as allHandlers from './handlers';
import parse from './parse';
import * as AllResolver from './resolver';
import * as AllImporter from './importer';
import * as utils from './utils';
import type { Options } from './babelParser';
import type { DocumentationObject } from './Documentation';
import type { Handler, Resolver, Importer } from './parse';

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
const defaultImporter: Importer = AllImporter.ignoreImports;

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
  src: string | Buffer,
  resolver?: Resolver | undefined | null,
  handlers?: Handler[] | undefined | null,
  // Used for backwards compatibility of this method
  options: Options & { importer?: Importer } = {},
): DocumentationObject[] | DocumentationObject {
  if (!resolver) {
    resolver = defaultResolver;
  }
  if (!handlers) {
    handlers = defaultHandlers;
  }

  const { importer = defaultImporter, ...opts } = options;

  return parse(String(src), resolver, handlers, importer, opts);
}

export {
  defaultParse as parse,
  defaultHandlers,
  allHandlers as handlers,
  AllResolver as resolver,
  AllImporter as importers,
  utils,
};
