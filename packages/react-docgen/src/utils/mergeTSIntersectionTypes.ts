import type {
  TSFunctionSignatureType,
  TypeDescriptor,
} from '../Documentation.js';

/**
 * Merges two TSFunctionSignatureType types into one.
 *
 * @example
 * const existingType = {
 *   "key": "children",
 *   "value": {
 *     "name": "ReactNode",
 *     "required": true,
 *   },
 * };
 * const newType = {
 *   "key": "children",
 *   "value": {
 *     "name": "never",
 *     "required": false,
 *   },
 * };
 *
 * return {
 *   "key": "children",
 *   "value": {
 *     "name": "ReactNode",
 *     "required": false,
 *   },
 * };
 */
export default (
  existingType: TypeDescriptor<TSFunctionSignatureType>,
  newType: TypeDescriptor<TSFunctionSignatureType>,
): TypeDescriptor<TSFunctionSignatureType> => {
  const required =
    newType.required === false || existingType.required === false
      ? false
      : existingType.required;

  const existingTypesArray = existingType.name.split('|').map((t) => t.trim());
  const existingTypes = new Set(existingTypesArray);

  if (!['never'].includes(newType.name)) {
    existingTypes.add(newType.name);
  }

  if (existingType.name === 'unknown' || newType.name === 'unknown') {
    return {
      name: 'unknown',
      required,
    };
  }

  return {
    name: Array.from(existingTypes).join(' | '),
    required,
  };
};
