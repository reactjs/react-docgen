import { matchesGlob } from 'node:path';
import type {
  Parser,
  ParserSelection,
  ParserSelector,
} from './ProjectContext.js';

export type ParserRouteTest = RegExp | string | ((filename: string) => boolean);

export interface ParserRoute {
  readonly options?: unknown;
  readonly parser: Parser;
  readonly test: ParserRouteTest;
}

export interface ParserRouter extends ParserSelector {
  readonly requiresFilename: boolean;
}

function matches(test: ParserRouteTest, filename: string): boolean {
  if (typeof test === 'function') return test(filename);
  if (typeof test === 'string') return matchesGlob(filename, test);

  test.lastIndex = 0;

  return test.test(filename);
}

export default function createParserRouter(
  routes: readonly ParserRoute[],
): ParserRouter {
  if (routes.length === 0) {
    throw new TypeError('Parser routes must not be empty.');
  }

  const router = (filename: string): ParserSelection => {
    const route = routes.find(({ test }) => matches(test, filename));

    if (!route) {
      throw Object.assign(new Error(`No parser route matched "${filename}".`), {
        code: 'ERR_REACTDOCGEN_PARSER_NO_MATCH',
      });
    }

    return { options: route.options, parser: route.parser };
  };

  return Object.assign(router, { requiresFilename: routes.length > 1 });
}
