import getPropType from '../utils/getPropType.js';
import getPropertyName from '../utils/getPropertyName.js';
import getMemberValuePath from '../utils/getMemberValuePath.js';
import isReactModuleName from '../utils/isReactModuleName.js';
import isRequiredPropType from '../utils/isRequiredPropType.js';
import printValue from '../utils/printValue.js';
import resolveToModule from '../utils/resolveToModule.js';
import resolveToValue from '../utils/resolveToValue.js';
import type Documentation from '../Documentation.js';
import type { PropDescriptor, PropTypeDescriptor } from '../Documentation.js';
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { Handler } from './index.js';
import type { ComponentNode } from '../resolver/index.js';

function isPropTypesExpression(path: NodePath): boolean {
  const moduleName = resolveToModule(path);

  if (moduleName) {
    return isReactModuleName(moduleName) || moduleName === 'ReactPropTypes';
  }

  return false;
}

function amendPropTypes(
  getDescriptor: (propName: string) => PropDescriptor,
  path: NodePath,
): void {
  if (!path.isObjectExpression()) {
    return;
  }

  path.get('properties').forEach(propertyPath => {
    if (propertyPath.isObjectProperty()) {
      const propName = getPropertyName(propertyPath);

      if (!propName) return;

      const propDescriptor = getDescriptor(propName);
      const valuePath = resolveToValue(propertyPath.get('value'));
      const type: PropTypeDescriptor = isPropTypesExpression(valuePath)
        ? getPropType(valuePath)
        : { name: 'custom', raw: printValue(valuePath) };

      if (type) {
        propDescriptor.type = type;
        propDescriptor.required =
          type.name !== 'custom' && isRequiredPropType(valuePath);
      }
    }
    if (propertyPath.isSpreadElement()) {
      const resolvedValuePath = resolveToValue(propertyPath.get('argument'));

      if (resolvedValuePath.isObjectExpression()) {
        // normal object literal
        amendPropTypes(getDescriptor, resolvedValuePath);
      }
    }
  });
}

function getPropTypeHandler(propName: string): Handler {
  return function (
    documentation: Documentation,
    componentDefinition: NodePath<ComponentNode>,
  ): void {
    let propTypesPath: NodePath<Node> | null = getMemberValuePath(
      componentDefinition,
      propName,
    );

    if (!propTypesPath) {
      return;
    }
    propTypesPath = resolveToValue(propTypesPath);
    if (!propTypesPath) {
      return;
    }
    let getDescriptor;

    switch (propName) {
      case 'childContextTypes':
        getDescriptor = documentation.getChildContextDescriptor;
        break;
      case 'contextTypes':
        getDescriptor = documentation.getContextDescriptor;
        break;
      default:
        getDescriptor = documentation.getPropDescriptor;
    }
    amendPropTypes(getDescriptor.bind(documentation), propTypesPath);
  };
}

export const propTypeHandler = getPropTypeHandler('propTypes');
export const contextTypeHandler = getPropTypeHandler('contextTypes');
export const childContextTypeHandler = getPropTypeHandler('childContextTypes');
