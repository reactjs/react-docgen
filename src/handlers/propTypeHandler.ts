import getPropType from '../utils/getPropType';
import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import isReactModuleName from '../utils/isReactModuleName';
import isRequiredPropType from '../utils/isRequiredPropType';
import printValue from '../utils/printValue';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';
import type Documentation from '../Documentation';
import type { PropDescriptor, PropTypeDescriptor } from '../Documentation';
import type { NodePath } from '@babel/traverse';
import type { Node } from '@babel/types';
import type { Handler } from '.';
import type { ComponentNode } from '../resolver';

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
