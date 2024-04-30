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
  newType: TypeDescriptor<TSFunctionSignatureType>,
  existingType: TypeDescriptor<TSFunctionSignatureType>,
): TypeDescriptor<TSFunctionSignatureType> => {
  const newTypeIsForbiddenToUse = ['never'].includes(newType.name);

  if (newTypeIsForbiddenToUse) {
    let mergedType = {
      ...existingType,
      required:
        newType.required === false || existingType.required === false
          ? false
          : existingType.required,
    };

    if ('nullable' in existingType) {
      mergedType = {
        ...mergedType,
        nullable: newType.nullable === true ? true : existingType.nullable,
      };
    }

    return mergedType;
  }

  return {
    ...newType,
    required:
      newType.required === false || existingType.required === false
        ? false
        : existingType.required,
  };
};
