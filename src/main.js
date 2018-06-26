/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

import * as handlers from './handlers';
import parse from './parse';
import * as resolver from './resolver';
import * as utils from './utils';
import type { Options } from './babelParser';

var defaultResolver = resolver.findExportedComponentDefinition;
var defaultHandlers = [
  handlers.propTypeHandler,
  handlers.contextTypeHandler,
  handlers.childContextTypeHandler,
  handlers.propTypeCompositionHandler,
  handlers.propDocBlockHandler,
  handlers.flowTypeHandler,
  handlers.defaultPropsHandler,
  handlers.componentDocblockHandler,
  handlers.displayNameHandler,
  handlers.componentMethodsHandler,
  handlers.componentMethodsJsDocHandler,
];

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
function defaultParse( // eslint-disable-line no-unused-vars
  src: string,
  resolver?: ?Resolver, // eslint-disable-line no-shadow
  handlers?: ?Array<Handler>, // eslint-disable-line no-shadow
  options ?: Options = {}
): Array<Object>|Object {
  if (!resolver) {
    resolver = defaultResolver;
  }
  if (!handlers) {
    handlers = defaultHandlers;
  }

  return parse(src, resolver, handlers, options);
}

export {
  defaultParse as parse,
  defaultHandlers,
  handlers,
  resolver,
  utils,
};
