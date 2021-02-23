import type { NodePath } from 'ast-types/lib/node-path';
import Documentation from './Documentation';
import type { DocumentationObject } from './Documentation';
import postProcessDocumentation from './utils/postProcessDocumentation';
import buildParser from './babelParser';
import type { Options, Parser, FileNodeWithOptions } from './babelParser';

const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

export type Importer = (
  path: NodePath,
  name: string,
) => NodePath | null | undefined;

export type Handler = (
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
) => void;
export type Resolver = (
  node: FileNodeWithOptions,
  parser: Parser,
  importer: Importer,
) => NodePath | NodePath[] | null | undefined;

function executeHandlers(
  handlers: Handler[],
  componentDefinitions: Array<NodePath<unknown>>,
  importer: Importer,
): DocumentationObject[] {
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
  handlers: Handler[],
  importer: Importer,
  options: Options = {},
): DocumentationObject[] | DocumentationObject {
  const parser = buildParser(options);
  const ast = parser.parse(src);
  ast.__src = src;
  const componentDefinitions = resolver(ast, parser, importer);

  if (Array.isArray(componentDefinitions)) {
    if (componentDefinitions.length === 0) {
      throw new Error(ERROR_MISSING_DEFINITION);
    }
    return executeHandlers(handlers, componentDefinitions, importer);
  } else if (componentDefinitions) {
    return executeHandlers(handlers, [componentDefinitions], importer)[0];
  }

  throw new Error(ERROR_MISSING_DEFINITION);
}

export { ERROR_MISSING_DEFINITION };
