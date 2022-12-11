import type { TransformOptions } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { Importer, ImportPath } from '../src/importer/index.js';
import FileState from '../src/FileState.js';
import babelParse from '../src/babelParser.js';
import type {
  ExportDefaultDeclaration,
  Expression,
  ExpressionStatement,
  Program,
  Statement,
} from '@babel/types';
import { afterEach } from 'vitest';

interface ParseCall {
  (code: string, importer: Importer): NodePath<Program>;
  (code: string, options: TransformOptions): NodePath<Program>;
  <B extends boolean = false>(
    code: string,
    options?: TransformOptions,
    importer?: Importer,
    returnFileState?: B,
  ): B extends true ? FileState : NodePath<Program>;
}

interface Parse extends ParseCall {
  expression<T = Expression>(
    src: string,
    options?: TransformOptions,
  ): NodePath<T>;
  expression<T = Expression>(
    src: string,
    importer: Importer,
    options?: TransformOptions,
  ): NodePath<T>;
  statement<T = Statement>(src: string, index?: number): NodePath<T>;
  statement<T = Statement>(
    src: string,
    importer: Importer,
    index?: number,
  ): NodePath<T>;
  statement<T = Statement>(
    src: string,
    options: TransformOptions,
    index?: number,
  ): NodePath<T>;
  statement<T = Statement>(
    src: string,
    importer: Importer,
    options: TransformOptions,
    index?: number,
  ): NodePath<T>;
  expressionLast<T = Expression>(
    src: string,
    options?: TransformOptions,
  ): NodePath<T>;
  expressionLast<T = Expression>(
    src: string,
    importer: Importer,
    options?: TransformOptions,
  ): NodePath<T>;
  statementLast<T = Expression>(
    src: string,
    options?: TransformOptions,
  ): NodePath<T>;
  statementLast<T = Expression>(
    src: string,
    importer: Importer,
    options?: TransformOptions,
  ): NodePath<T>;
}

function parseDefault(
  code: string,
  options: Importer | TransformOptions,
  importer: Importer,
  returnFileState: true,
): FileState;
function parseDefault(
  code: string,
  options: Importer | TransformOptions,
  importer: Importer,
  returnFileState: false,
): NodePath<Program>;
/**
 * Returns a NodePath to the program path of the passed node
 * Parses JS and Flow
 */
function parseDefault(
  code: string,
  options: Importer | TransformOptions = {},
  importer: Importer = noopImporter,
  returnFileState = false,
): FileState | NodePath<Program> {
  if (typeof options !== 'object') {
    importer = options;
    options = {};
  }
  const opts = {
    babelrc: false,
    ...options,
  };
  const ast = babelParse(code, opts);
  const fileState = new FileState(opts, {
    ast,
    code,
    importer,
  });

  if (returnFileState) {
    return fileState;
  }

  return fileState.path;
}

const parseTS: ParseCall = function (
  code: string,
  options: Importer | TransformOptions = {},
  importer: Importer = noopImporter,
): NodePath<Program> {
  if (typeof options !== 'object') {
    importer = options;
    options = {};
  }

  return parseDefault(
    code,
    {
      filename: 'file.tsx',
      parserOpts: { plugins: ['typescript'] },
      ...options,
    },
    importer,
    false,
  );
};

export const parse = buildTestParser(parseDefault as Parse);
export const parseTypescript = buildTestParser(parseTS as Parse);

function buildTestParser(parseFunction: Parse): Parse {
  parseFunction.statement = function <T = Statement>(
    this: Parse,
    src: string,
    importer: Importer | TransformOptions | number = noopImporter,
    options: TransformOptions | number = {},
    index = 0,
  ): NodePath<T> {
    if (typeof options === 'number') {
      index = options;
      options = {};
    }
    if (typeof importer === 'number') {
      index = importer;
      importer = noopImporter;
    } else if (typeof importer === 'object') {
      options = importer;
      importer = noopImporter;
    }
    const root = this(src, options, importer, false);

    if (index < 0) {
      index = root.node.body.length + index;
    }

    return root.get('body')[index] as unknown as NodePath<T>;
  };

  parseFunction.statementLast = function <T = Expression>(
    this: Parse,
    src: string,
    importer: Importer | TransformOptions = noopImporter,
    options: TransformOptions = {},
  ): NodePath<T> {
    if (typeof importer === 'object') {
      options = importer;
      importer = noopImporter;
    }

    return this.statement<T>(src, importer, options, -1);
  };

  parseFunction.expression = function <T = Expression>(
    this: Parse,
    src: string,
    importer: Importer | TransformOptions = noopImporter,
    options: TransformOptions = {},
  ): NodePath<T> {
    if (typeof importer === 'object') {
      options = importer;
      importer = noopImporter;
    }

    return this.statement<ExpressionStatement>(
      `(${src})`,
      importer,
      options,
    ).get('expression') as unknown as NodePath<T>;
  };

  parseFunction.expressionLast = function <T = Expression>(
    this: Parse,
    src: string,
    importer: Importer | TransformOptions = noopImporter,
    options: TransformOptions = {},
  ): NodePath<T> {
    if (typeof importer === 'object') {
      options = importer;
      importer = noopImporter;
    }

    return this.statement<ExpressionStatement>(src, importer, options, -1).get(
      'expression',
    ) as unknown as NodePath<T>;
  };

  return parseFunction;
}

/**
 * Importer that doesn't resolve any values
 */
export const noopImporter: Importer = (): null => {
  return null;
};
/**
 * Builds an importer where the keys are import paths and the values are AST nodes
 */
export function makeMockImporter(
  mocks: Record<
    string,
    (
      stmtLast: <T = ExportDefaultDeclaration>(
        code: string,
        isTs?: boolean,
        index?: number,
      ) => NodePath<T>,
    ) => NodePath
  > = {},
): Importer {
  const stmtLast = <T = ExportDefaultDeclaration>(
    code: string,
    isTs = false,
    index = -1,
  ): NodePath<T> => {
    const parser = isTs ? parseTypescript : parse;

    return parser.statement(code, importer, index);
  };
  let cache: Record<string, NodePath> = Object.create(null);
  const importer: Importer = (path: ImportPath): NodePath | null => {
    const source = path.node.source?.value;

    if (!source) {
      throw new Error(`Cannot find mock source on ImportPath for ${path.type}`);
    }

    if (cache[source] === undefined) {
      cache[source] = mocks[source]?.(stmtLast);
    }

    return cache[source];
  };

  afterEach(() => {
    cache = Object.create(null);
  });

  return importer;
}
