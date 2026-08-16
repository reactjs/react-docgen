import type { AstNode } from './AstNode.js';

export interface SourceFile {
  readonly code: string;
  readonly filename: string;
}

export interface Parser {
  parse(source: SourceFile): AstNode;
}

export type ParserSelector = (filename: string) => Parser;
export type Importer = (specifier: string, fromFilename: string) => SourceFile;

export class FileState {
  readonly ast: AstNode;
  readonly source: SourceFile;

  readonly #project: ProjectContext;

  constructor(project: ProjectContext, source: SourceFile, ast: AstNode) {
    this.#project = project;
    this.source = source;
    this.ast = ast;
  }

  import(specifier: string): FileState {
    return this.#project.import(specifier, this.source.filename);
  }
}

interface ProjectContextOptions {
  importer: Importer;
  selectParser: ParserSelector;
}

export default class ProjectContext {
  readonly #importer: Importer;
  readonly #selectParser: ParserSelector;

  constructor({ importer, selectParser }: ProjectContextOptions) {
    this.#importer = importer;
    this.#selectParser = selectParser;
  }

  parse(source: SourceFile): FileState {
    const ast = this.#selectParser(source.filename).parse(source);

    return new FileState(this, source, ast);
  }

  import(specifier: string, fromFilename: string): FileState {
    return this.parse(this.#importer(specifier, fromFilename));
  }
}
