import componentHandler from './handlers/componentHandler.js';
import contextHandler from './handlers/contextHandler.js';
import defaultPropsHandler from './handlers/defaultPropsHandler.js';
import createMethodHandler from './handlers/methodHandler.js';
import propTypesHandler from './handlers/propTypesHandler.js';

const reactHandlers = [
  componentHandler,
  propTypesHandler,
  defaultPropsHandler,
  contextHandler,
  createMethodHandler(),
];

export default reactHandlers;
