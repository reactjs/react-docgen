import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const languages = ['flow', 'js', 'typescript'] as const;
const features = [
  'defaults',
  'definitions',
  'documentation',
  'errors',
  'exports',
  'imports',
  'methods',
  'props',
  'regressions',
  'types',
] as const;
const entryPattern = /^index\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx)$/;

export type IntegrationLanguage = (typeof languages)[number];

export interface IntegrationError {
  code: string;
}

export interface IntegrationCase {
  directory: string;
  error?: IntegrationError;
  feature: string;
  filename: string;
  id: string;
  language: IntegrationLanguage;
  output?: unknown;
  source: string;
}

export interface LoadIntegrationCasesOptions {
  ids?: readonly string[];
  languages?: readonly IntegrationLanguage[];
}

export const casesRoot = fileURLToPath(new URL('../cases', import.meta.url));

function directories(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readJson(filename: string): unknown {
  return JSON.parse(fs.readFileSync(filename, 'utf8')) as unknown;
}

function loadCase(
  language: IntegrationLanguage,
  feature: string,
  name: string,
): IntegrationCase {
  const directory = path.join(casesRoot, language, feature, name);
  const files = fs.readdirSync(directory);
  const entries = files.filter((file) => entryPattern.test(file));
  const outcomes = files.filter(
    (file) => file === 'error.json' || file === 'output.json',
  );

  if (entries.length !== 1) {
    throw new Error(
      `Integration case "${language}/${feature}/${name}" must contain exactly one index source file.`,
    );
  }

  if (outcomes.length !== 1) {
    throw new Error(
      `Integration case "${language}/${feature}/${name}" must contain exactly one output.json or error.json.`,
    );
  }

  const [entry] = entries;
  const [outcome] = outcomes;

  if (entry === undefined || outcome === undefined) {
    throw new Error(
      `Invalid integration case "${language}/${feature}/${name}".`,
    );
  }

  const id = `${language}/${feature}/${name}`;
  const filename = path.join(directory, entry);

  return {
    directory,
    feature,
    filename,
    id,
    language,
    source: fs.readFileSync(filename, 'utf8'),
    ...(outcome === 'output.json'
      ? { output: readJson(path.join(directory, outcome)) }
      : {
          error: readJson(path.join(directory, outcome)) as IntegrationError,
        }),
  };
}

export function loadIntegrationCases(
  options: LoadIntegrationCasesOptions = {},
): IntegrationCase[] {
  const selectedLanguages = options.languages ?? languages;
  const selectedIds = options.ids ? new Set(options.ids) : null;
  const cases: IntegrationCase[] = [];

  for (const language of selectedLanguages) {
    if (!(languages as readonly string[]).includes(language)) {
      throw new Error(`Unknown integration language "${language}".`);
    }

    for (const feature of directories(path.join(casesRoot, language))) {
      if (!(features as readonly string[]).includes(feature)) {
        throw new Error(
          `Unknown integration feature "${language}/${feature}".`,
        );
      }

      for (const name of directories(path.join(casesRoot, language, feature))) {
        const integrationCase = loadCase(language, feature, name);

        if (!selectedIds || selectedIds.has(integrationCase.id)) {
          cases.push(integrationCase);
        }
      }
    }
  }

  if (selectedIds) {
    const foundIds = new Set(cases.map(({ id }) => id));
    const missingIds = [...selectedIds].filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new Error(`Unknown integration cases: ${missingIds.join(', ')}.`);
    }
  }

  return cases;
}
