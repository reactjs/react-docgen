import type { AstNode } from './AstNode.js';
import AstPath from './AstPath.js';
import type { VisitorKeys } from './AstNode.js';
import traverse, { type Visitor } from './traverse.js';

export interface SourceFile {
  readonly code: string;
  readonly filename: string;
}

export interface Parser {
  readonly visitorKeys: VisitorKeys;
  parse(source: SourceFile): AstNode;
}

export type ParserSelector = (filename: string) => Parser;
export type Importer = (specifier: string, fromFilename: string) => SourceFile;

export class FileState {
  readonly ast: AstNode;
  readonly path: AstPath;
  readonly source: SourceFile;
  readonly visitorKeys: VisitorKeys;

  readonly #project: ProjectContext;

  constructor(
    project: ProjectContext,
    source: SourceFile,
    ast: AstNode,
    visitorKeys: VisitorKeys,
  ) {
    this.#project = project;
    this.source = source;
    this.ast = ast;
    this.path = new AstPath({ node: ast });
    this.visitorKeys = visitorKeys;
  }

  import(specifier: string): FileState {
    return this.#project.import(specifier, this.source.filename);
  }

  traverse<State>(visitor: Visitor<State>, state: State): void {
    traverse(this.ast, this.visitorKeys, visitor, state);
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
    const parser = this.#selectParser(source.filename);
    const ast = parser.parse(source);

    return new FileState(this, source, ast, parser.visitorKeys);
  }

  import(specifier: string, fromFilename: string): FileState {
    return this.parse(this.#importer(specifier, fromFilename));
  }
}
