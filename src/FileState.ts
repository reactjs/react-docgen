import type { Options, Parser } from './babelParser';
import type { HubInterface, Scope, Visitor } from '@babel/traverse';
import traverse, { NodePath } from '@babel/traverse';
import type { File, Node, Program } from '@babel/types';
import type { Importer, ImportPath } from './importer';

export default class FileState {
  opts: Options;
  path: NodePath<Program>;
  ast: File;
  scope: Scope;
  code: string;

  #importer: Importer;
  #parser: Parser;

  hub: HubInterface = {
    // keep it for the usage in babel-core, ex: path.hub.file.opts.filename
    file: this,
    parse: this.parse.bind(this),
    import: this.import.bind(this),
    getCode: () => this.code,
    getScope: () => this.scope,
    addHelper: () => undefined,
    buildError: <E extends Error>(
      node: Node,
      msg: string,
      Error: new (message?: string) => E,
    ): E & { node: Node } => {
      const err = new Error(msg);

      (err as E & { node: Node }).node = node;

      return err as E & { node: Node };
    },
  };

  constructor(
    options: Options,
    {
      code,
      ast,
      importer,
      parser,
    }: { code: string; ast: File; importer: Importer; parser: Parser },
  ) {
    this.opts = options;
    this.code = code;
    this.ast = ast;
    this.#importer = importer;
    this.#parser = parser;

    this.path = NodePath.get({
      hub: this.hub,
      parentPath: null,
      parent: this.ast,
      container: this.ast,
      key: 'program',
      // @ts-expect-error TODO FIX DT https://github.com/babel/babel/blob/b58e35b6aa30a4c58da3147ae4a1fb5cef2073c9/packages/babel-traverse/src/path/context.ts#L158
    }).setContext() as NodePath<Program>;
    this.scope = this.path.scope;
  }

  /**
   * Try to resolve and import with the `name`
   */
  import(path: ImportPath, name: string): NodePath | null {
    return this.#importer(path, name, this);
  }

  /**
   * Parse the content of a new file
   * The filename is required so that potential imports inside the content can be correctly resolved
   */
  parse(code: string, filename: string): FileState {
    const ast = this.#parser(code);

    return new FileState(
      { ...this.opts, filename },
      {
        ast,
        code,
        importer: this.#importer,
        parser: this.#parser,
      },
    );
  }

  traverse<S>(visitors: Visitor<S>, state?: S): void;
  traverse(visitors: Visitor): void;
  /**
   * Traverse the current file
   */
  traverse(visitors: Visitor, state?: any): void {
    traverse(this.ast, visitors, this.scope, state);
  }
}
