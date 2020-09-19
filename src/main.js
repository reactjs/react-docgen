/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as allHandlers from './handlers';
import parse from './parse';
import * as AllResolver from './resolver';
import * as AllImporter from './importer';
import * as utils from './utils';
import type { Options } from './babelParser';
import type { DocumentationObject } from './Documentation';
import type { Handler, Resolver, Importer } from './types';

const defaultResolver = AllResolver.findExportedComponentDefinition;
const defaultHandlers = [
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
const defaultImporter = AllImporter.resolveImports;

/**
 * See `lib/parse.js` for more information about the arguments. This function
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
  resolver?: ?Resolver,
  handlers?: ?Array<Handler>,
  importer?: ?Importer,
  options?: Options = {},
): Array<DocumentationObject> | DocumentationObject {
  if (!resolver) {
    resolver = defaultResolver;
  }
  if (!handlers) {
    handlers = defaultHandlers;
  }
  if (!importer) {
    importer = defaultImporter;
  }

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
