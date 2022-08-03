import type { Node } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import type { Options, Parser } from '../src/babelParser';
import type { Importer, ImportPath } from '../src/importer';
import FileState from '../src/FileState';
import buildParser from '../src/babelParser';
import type {
  ExportDefaultDeclaration,
  Expression,
  ExpressionStatement,
  Program,
  Statement,
} from '@babel/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R> {
      toEqualASTNode: (expected: Node | NodePath) => CustomMatcherResult;
    }
  }
}

export function getParser(options: Options = {}): Parser {
  return buildParser(options);
}

interface ParseCall {
  (code: string, importer: Importer): NodePath<Program>;
  (code: string, options: Options): NodePath<Program>;
  <B extends boolean = false>(
    code: string,
    options?: Options,
    importer?: Importer,
    returnFileState?: B,
  ): B extends true ? FileState : NodePath<Program>;
}

interface Parse extends ParseCall {
  expression<T = Expression>(src: string, options?: Options): NodePath<T>;
  expression<T = Expression>(
    src: string,
    importer: Importer,
    options?: Options,
  ): NodePath<T>;
  statement<T = Statement>(src: string, index?: number): NodePath<T>;
  statement<T = Statement>(
    src: string,
    importer: Importer,
    index?: number,
  ): NodePath<T>;
  statement<T = Statement>(
    src: string,
    options: Options,
    index?: number,
  ): NodePath<T>;
  statement<T = Statement>(
    src: string,
    importer: Importer,
    options: Options,
    index?: number,
  ): NodePath<T>;
  expressionLast<T = Expression>(src: string, options?: Options): NodePath<T>;
  expressionLast<T = Expression>(
    src: string,
    importer: Importer,
    options?: Options,
  ): NodePath<T>;
  statementLast<T = Expression>(src: string, options?: Options): NodePath<T>;
  statementLast<T = Expression>(
    src: string,
    importer: Importer,
    options?: Options,
  ): NodePath<T>;
}

/**
 * Returns a NodePath to the program path of the passed node
 * Parses JS and Flow
 */
const parseDefault: ParseCall = function (
  code: string,
  options: Importer | Options = {},
  importer: Importer = noopImporter,
  returnFileState = false,
): typeof returnFileState extends true ? FileState : NodePath<Program> {
  if (typeof options !== 'object') {
    importer = options;
    options = {};
  }
  const opts = {
    babelrc: false,
    ...options,
  };
  const parser = getParser(opts);
  const ast = parser(code);
  const fileState = new FileState(opts, {
    ast,
    code,
    importer,
    parser,
  });

  if (returnFileState) {
    return fileState as any;
  }

  return fileState.path as any;
};

const parseTS: ParseCall = function (
  code: string,
  options: Importer | Options = {},
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
      parserOptions: { plugins: ['typescript'] },
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
    importer: Importer | Options | number = noopImporter,
    options: Options | number = {},
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
    importer: Importer | Options = noopImporter,
    options: Options = {},
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
    importer: Importer | Options = noopImporter,
    options: Options = {},
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
    importer: Importer | Options = noopImporter,
    options: Options = {},
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
