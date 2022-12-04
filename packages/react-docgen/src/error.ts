export enum ERROR_CODES {
  MISSING_DEFINITION = 'ERR_REACTDOCGEN_MISSING_DEFINITION',
  MULTIPLE_DEFINITIONS = 'ERR_REACTDOCGEN_MULTIPLE_DEFINITIONS',
}

const messages = new Map([
  [ERROR_CODES.MISSING_DEFINITION, 'No suitable component definition found.'],
  [
    ERROR_CODES.MULTIPLE_DEFINITIONS,
    'Multiple exported component definitions found.',
  ],
]);

export class ReactDocgenError extends Error {
  code: string | undefined;
  constructor(code: ERROR_CODES) {
    super(messages.get(code));

    this.code = code;
  }
}
