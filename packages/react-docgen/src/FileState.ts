import type { HubInterface, Scope, Visitor } from '@babel/traverse';
import babelTraverse, { NodePath } from '@babel/traverse';
import type { File, Node, Program } from '@babel/types';
import type { Importer, ImportPath } from './importer/index.js';
import babelParse from './babelParser.js';
import type { TransformOptions } from '@babel/core';

// Workaround while babel is not a proper ES module
const traverse = babelTraverse.default ?? babelTraverse;

export default class FileState {
  opts: TransformOptions;
  path: NodePath<Program>;
  ast: File;
  scope: Scope;
  code: string;

  #importer: Importer;

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
    options: TransformOptions,
    { code, ast, importer }: { code: string; ast: File; importer: Importer },
  ) {
    this.opts = options;
    this.code = code;
    this.ast = ast;
    this.#importer = importer;

    this.path = NodePath.get({
      hub: this.hub,
      parentPath: null,
      parent: this.ast,
      container: this.ast,
      key: 'program',
    }).setContext() as NodePath<Program>;
    this.scope = this.path.scope;
  }

  /**
   * Try to resolve and import the ImportPath with the `name`
   */
  import(path: ImportPath, name: string): NodePath | null {
    return this.#importer(path, name, this);
  }

  /**
   * Parse the content of a new file
   * The `filename` is required so that potential imports inside the content can be correctly resolved and
   * the correct babel config file could be loaded. `filename` needs to be an absolute path.
   */
  parse(code: string, filename: string): FileState {
    const newOptions = { ...this.opts, filename };
    // We need to build a new parser, because there might be a new
    // babel config file in effect, so we need to load it
    const ast = babelParse(code, newOptions);

    return new FileState(newOptions, {
      ast,
      code,
      importer: this.#importer,
    });
  }

  traverse<S>(visitors: Visitor<S>, state?: S): void;
  traverse(visitors: Visitor): void;
  /**
   * Traverse the current file
   */
  traverse(visitors: Visitor, state?: unknown): void {
    traverse(this.ast, visitors, this.scope, state);
  }
}
