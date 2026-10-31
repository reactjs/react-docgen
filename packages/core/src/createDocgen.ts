import extract, {
  type ComponentDocumentation,
  type Handler,
  type Resolver,
} from './extract.js';
import ProjectContext, {
  type Importer,
  type Parser,
  type ParserSelector,
} from './ProjectContext.js';
import type { ParserRouter } from './createParserRouter.js';

export interface CreateDocgenOptions {
  handlers: readonly Handler[];
  importer?: Importer;
  parser: Parser | ParserSelector;
  resolver: Resolver;
}

export interface DocgenParseOptions {
  filename?: string;
  importer?: Importer;
}

export default function createDocgen({
  handlers,
  importer: defaultImporter,
  parser,
  resolver,
}: CreateDocgenOptions): (
  code: string,
  options?: DocgenParseOptions,
) => ComponentDocumentation[] {
  return (code, options = {}) => {
    const { importer } = options;
    const filename = options.filename ?? 'component.js';

    if (
      typeof parser === 'function' &&
      (parser as ParserRouter).requiresFilename &&
      options.filename == null
    ) {
      throw new TypeError(
        'A filename is required when multiple parsers are configured.',
      );
    }

    const project = new ProjectContext({
      importer:
        importer ??
        defaultImporter ??
        (() => {
          throw new Error('An importer is required to resolve imported files.');
        }),
      selectParser: typeof parser === 'function' ? parser : () => parser,
    });
    const file = project.parse({ code, filename });

    return extract(file, resolver, handlers);
  };
}
