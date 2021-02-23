import {
  loadPartialConfig,
  parseSync,
  ParserOptions,
  TransformOptions,
} from '@babel/core';
import * as t from '@babel/types';
import path from 'path';

const TYPESCRIPT_EXTS = {
  '.ts': true,
  '.tsx': true,
};

function getDefaultPlugins(
  options: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  return [
    'jsx',
    TYPESCRIPT_EXTS[path.extname(options.filename || '')]
      ? 'typescript'
      : 'flow',
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    ['decorators', { decoratorsBeforeExport: false }],
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    ['pipelineOperator', { proposal: 'minimal' }],
    'throwExpressions',
    'topLevelAwait',
  ];
}

export type Options = TransformOptions & { parserOptions?: ParserOptions };
export type FileNodeWithOptions = t.File & {
  program: { options: Options };
  __src: string;
};

export interface Parser {
  parse: (src: string) => FileNodeWithOptions;
}

function buildPluginList(
  parserOptions: ParserOptions | undefined,
  babelOptions: TransformOptions,
): NonNullable<ParserOptions['plugins']> {
  let plugins: NonNullable<ParserOptions['plugins']> = [];

  if (parserOptions && parserOptions.plugins) {
    plugins = [...parserOptions.plugins];
  }

  const partialConfig = loadPartialConfig(babelOptions);

  if (
    partialConfig &&
    !partialConfig.hasFilesystemConfig() &&
    plugins.length === 0
  ) {
    plugins = getDefaultPlugins(babelOptions);
  }

  // Ensure we always have estree plugin enabled, if we add it a second time
  // here it does not matter
  plugins.push('estree');

  return plugins;
}

function buildOptions(
  parserOptions: ParserOptions | undefined,
  babelOptions: TransformOptions,
): ParserOptions {
  const plugins = buildPluginList(parserOptions, babelOptions);

  return {
    ...(parserOptions || {}),
    plugins,
  };
}

export default function buildParse(options: Options = {}): Parser {
  const { parserOptions, ...babelOptions } = options;
  const parserOpts = buildOptions(parserOptions, babelOptions);
  const opts: TransformOptions = {
    parserOpts,
    ...babelOptions,
  };

  return {
    parse(src: string): FileNodeWithOptions {
      const ast = parseSync(src, opts) as FileNodeWithOptions;
      // Attach options to the Program node, for use when processing imports.
      ast.program.options = options;
      return ast;
    },
  };
}
