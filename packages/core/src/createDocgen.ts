import extract, {
  type ComponentDocumentation,
  type Handler,
  type Resolver,
} from './extract.js';
import ProjectContext, {
  type Importer,
  type Parser,
} from './ProjectContext.js';

export interface CreateDocgenOptions {
  handlers: readonly Handler[];
  importer?: Importer;
  parser: Parser;
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
  return (code, { filename = 'component.js', importer } = {}) => {
    const project = new ProjectContext({
      importer:
        importer ??
        defaultImporter ??
        (() => {
          throw new Error('An importer is required to resolve imported files.');
        }),
      selectParser: () => parser,
    });
    const file = project.parse({ code, filename });

    return extract(file, resolver, handlers);
  };
}
