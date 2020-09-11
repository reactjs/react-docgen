/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Documentation, { type DocumentationObject } from './Documentation';
import postProcessDocumentation from './utils/postProcessDocumentation';
import buildParser, { type Options, type Parser } from './babelParser';
import type { Handler, Resolver, Importer } from './types';

const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

function executeHandlers(
  handlers: Array<Handler>,
  componentDefinitions: Array<NodePath>,
  parser: Parser,
  importer: Importer,
): Array<DocumentationObject> {
  return componentDefinitions.map(
    (componentDefinition: NodePath): DocumentationObject => {
      const documentation = new Documentation();
      handlers.forEach(handler =>
        handler(documentation, componentDefinition, importer),
      );
      return postProcessDocumentation(documentation.toObject());
    },
  );
}

/**
 * Takes JavaScript source code and returns an object with the information
 * extract from it.
 *
 * `resolver` is a strategy to find the AST node(s) of the component
 * definition(s) inside `src`.
 * It is a function that gets passed the program AST node of
 * the source as first argument, and a reference to the parser as second argument.
 *
 * This allows you define your own strategy for finding component definitions.
 *
 * `handlers` is an array of functions which are passed a reference to the
 * component definitions (extracted by `resolver`) so that they can extract
 * information from it. They get also passed a reference to a `Documentation`
 * object to attach the information to. A reference to the parser is parsed as the
 * last argument.
 *
 * If `resolver` returns an array of component definitions, `parse` will return
 * an array of documentation objects. If `resolver` returns a single node
 * instead, `parse` will return a documentation object.
 */
export default function parse(
  src: string,
  resolver: Resolver,
  handlers: Array<Handler>,
  importer: Importer,
  options: Options,
): Array<DocumentationObject> | DocumentationObject {
  const parser = buildParser(options);
  const ast = parser.parse(src);
  ast.__src = src;
  const componentDefinitions = resolver(ast, parser, importer);

  if (Array.isArray(componentDefinitions)) {
    if (componentDefinitions.length === 0) {
      throw new Error(ERROR_MISSING_DEFINITION);
    }
    return executeHandlers(handlers, componentDefinitions, parser, importer);
  } else if (componentDefinitions) {
    return executeHandlers(
      handlers,
      [componentDefinitions],
      parser,
      importer,
    )[0];
  }

  throw new Error(ERROR_MISSING_DEFINITION);
}

export { ERROR_MISSING_DEFINITION };
