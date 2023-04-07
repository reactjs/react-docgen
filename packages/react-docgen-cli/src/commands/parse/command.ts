#!/usr/bin/env node
import glob from 'fast-glob';
import debugFactory from 'debug';
import { program } from 'commander';
import { builtinHandlers, parse } from 'react-docgen';
import { readFile } from 'fs/promises';
import outputResult from './output/outputResult.js';
import loadOptions from './options/loadOptions.js';
import outputError from './output/outputError.js';
import { resolve } from 'path';
import slash from 'slash';
import type { Documentation } from 'react-docgen';
import { ResolverConfigs } from './options/loadResolvers.js';

const debug = debugFactory('react-docgen:cli');

const defaultIgnoreGlobs = [
  '**/node_modules/**',
  '**/__tests__/**',
  '**/__mocks__/**',
];

const defaultHandlers = Object.keys(builtinHandlers);
const defaultResolvers = ['find-exported-component'];

function collect(value: string, previous: string[]): string[] {
  if (
    !previous ||
    previous === defaultIgnoreGlobs ||
    previous === defaultHandlers ||
    previous === defaultResolvers
  ) {
    previous = [];
  }

  const values = value.split(',');

  return previous.concat(values);
}

interface CLIOptions {
  defaultIgnores: boolean;
  failOnWarning: boolean;
  handler?: string[];
  ignore: string[];
  importer?: string;
  out?: string;
  pretty: boolean;
  resolver?: string[];
}

program
  .name('react-docgen-parse')
  .description(
    'Extract meta information from React components.\n' +
      'Either specify a paths to files or a glob pattern that matches multiple files.',
  )
  .option(
    '-o, --out <file>',
    'Store extracted information in the specified file instead of printing to stdout. If the file exists it will be overwritten.',
  )
  .option(
    '-i, --ignore <glob>',
    'Comma separated list of glob patterns which will ignore the paths that match. Can also be used multiple times.',
    collect,
    defaultIgnoreGlobs,
  )
  .option(
    '--no-default-ignores',
    'Do not ignore the node_modules, __tests__, and __mocks__ directories.',
  )
  .option('--pretty', 'Print the output JSON pretty', false)
  .option(
    '--failOnWarning',
    'Fail with exit code 2 on react-docgen component warnings. This includes "no component found" and "multiple components found" warnings.',
    false,
  )
  .option(
    '--resolver <resolvers>',
    `Built-in resolver config (${Object.values(ResolverConfigs).join(
      ', ',
    )}), package name or path to a module that exports a resolver. Can also be used multiple times. When used, no default handlers will be added.`,
    collect,
    defaultResolvers,
  )
  .option(
    '--importer <importer>',
    'Built-in importer name (fsImport, ignoreImporter), package name or path to a module that exports an importer.',
    'fsImporter',
  )
  .option(
    '--handler <handlers>',
    'Comma separated list of handlers to use. Can also be used multiple times. When used, no default handlers will be added.',
    collect,
    defaultHandlers,
  )
  .argument('<globs...>', 'Can be globs or paths to files')
  .action(async (globs: string[], input: CLIOptions) => {
    const {
      defaultIgnores,
      failOnWarning,
      handler,
      ignore,
      importer,
      out: output,
      pretty,
      resolver,
    } = input;

    let finalIgnores = ignore;

    // Push the default ignores unless the --no-default-ignore is set
    if (defaultIgnores === true && ignore !== defaultIgnoreGlobs) {
      finalIgnores.push(...defaultIgnoreGlobs);
    } else if (defaultIgnores === false && ignore === defaultIgnoreGlobs) {
      finalIgnores = [];
    }

    const options = await loadOptions({
      handler,
      importer,
      resolver,
    });
    // we use slash to convert windows backslashes to unix format so fast-glob works
    const files = await glob(globs.map(slash), {
      ignore: finalIgnores?.map((ignorePath) => {
        ignorePath = ignorePath.trim();
        // If the ignore glob starts with a dot we need to resolve the path to an
        // absolute path in order for it to work
        if (ignorePath.startsWith('.')) {
          ignorePath = resolve(process.cwd(), ignorePath);
        }

        // we use slash to convert windows backslashes to unix format so fast-glob works
        return slash(ignorePath);
      }),
    });
    const result: Record<string, Documentation[]> = {};
    let errorEncountered = false;

    await Promise.all(
      files.map(async (path) => {
        debug(`Reading file ${path}`);
        const content = await readFile(path, 'utf-8');

        try {
          result[path] = parse(content, {
            filename: path,
            handlers: options.handlers,
            importer: options.importer,
            resolver: options.resolver,
          });
        } catch (error) {
          const isError = outputError(error as Error, path, { failOnWarning });

          if (isError) {
            errorEncountered = true;
          }
        }
      }),
    );
    if (!errorEncountered) {
      await outputResult(result, { pretty, output });
    }
  });

program.parse();
