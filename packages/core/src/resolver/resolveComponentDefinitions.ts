import type { Resolver } from '../extract.js';
import findExportedDefinitions from './findExportedDefinitions.js';

const resolveComponentDefinitions: Resolver = (file) => {
  const definitions = findExportedDefinitions(file);

  if (definitions.length === 1) return definitions;

  throw Object.assign(
    new Error(
      definitions.length === 0
        ? 'No component definition found.'
        : 'Multiple component definitions found.',
    ),
    {
      code:
        definitions.length === 0
          ? 'ERR_REACTDOCGEN_MISSING_DEFINITION'
          : 'ERR_REACTDOCGEN_MULTIPLE_DEFINITIONS',
    },
  );
};

export default resolveComponentDefinitions;
