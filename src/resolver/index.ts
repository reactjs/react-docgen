import findAllComponentDefinitions from './findAllComponentDefinitions';
import findAllExportedComponentDefinitions from './findAllExportedComponentDefinitions';
import findExportedComponentDefinition from './findExportedComponentDefinition';
import type { NodePath } from '@babel/traverse';
import type FileState from '../FileState';

export {
  findAllComponentDefinitions,
  findAllExportedComponentDefinitions,
  findExportedComponentDefinition,
};
export type Resolver = (file: FileState) => NodePath[];
