import Documentation from './Documentation';
import type { DocumentationObject } from './Documentation';
import postProcessDocumentation from './utils/postProcessDocumentation';
import buildParser from './babelParser';
import type { Options } from './babelParser';
import type { NodePath } from '@babel/traverse';
import type { Handler } from './handlers';
import type { Importer } from './importer';
import type { ComponentNode, Resolver } from './resolver';
import FileState from './FileState';

const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';

function executeHandlers(
  handlers: Handler[],
  componentDefinitions: Array<NodePath<ComponentNode>>,
): DocumentationObject[] {
  return componentDefinitions.map(
    (componentDefinition): DocumentationObject => {
      const documentation = new Documentation();
      handlers.forEach(handler => handler(documentation, componentDefinition));
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
 */
export default function parse(
  code: string,
  resolver: Resolver,
  handlers: Handler[],
  importer: Importer,
  options: Options = {},
): DocumentationObject[] {
  const parser = buildParser(options);
  const ast = parser(code);

  const fileState = new FileState(options, {
    ast,
    code,
    importer,
    parser,
  });

  const componentDefinitions = resolver(fileState);

  if (componentDefinitions.length === 0) {
    throw new Error(ERROR_MISSING_DEFINITION);
  }
  return executeHandlers(handlers, componentDefinitions);
}

export { ERROR_MISSING_DEFINITION };
