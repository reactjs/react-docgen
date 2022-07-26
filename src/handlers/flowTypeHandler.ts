import type Documentation from '../Documentation';
import { unwrapUtilityType } from '../utils/flowUtilityTypes';
import getFlowType from '../utils/getFlowType';
import getTypeFromReactComponent, {
  applyToTypeProperties,
} from '../utils/getTypeFromReactComponent';
import getPropertyName from '../utils/getPropertyName';
import getTSType from '../utils/getTSType';
import type { TypeParameters } from '../utils/getTypeParameters';
import resolveToValue from '../utils/resolveToValue';
import setPropDescription from '../utils/setPropDescription';
import type { NodePath } from '@babel/traverse';
import type { FlowType } from '@babel/types';
import type { ComponentNode } from '../resolver';
import type { Handler } from '.';

function setPropDescriptor(
  documentation: Documentation,
  path: NodePath,
  typeParams: TypeParameters | null,
): void {
  if (path.isObjectTypeSpreadProperty()) {
    const argument = unwrapUtilityType(
      path.get('argument'),
    ) as NodePath<FlowType>;

    if (argument.isObjectTypeAnnotation()) {
      applyToTypeProperties(
        documentation,
        argument,
        (propertyPath, innerTypeParams) => {
          setPropDescriptor(documentation, propertyPath, innerTypeParams);
        },
        typeParams,
      );
      return;
    }

    // TODO what about other types here
    const id = argument.get('id') as NodePath;
    if (!id.hasNode() || !id.isIdentifier()) {
      return;
    }
    const resolvedPath = resolveToValue(id);

    if (resolvedPath && resolvedPath.isTypeAlias()) {
      const right = resolvedPath.get('right');
      applyToTypeProperties(
        documentation,
        right,
        (propertyPath, innerTypeParams) => {
          setPropDescriptor(documentation, propertyPath, innerTypeParams);
        },
        typeParams,
      );
    } else if (!argument.has('typeParameters')) {
      documentation.addComposes(id.node.name);
    }
  } else if (path.isObjectTypeProperty()) {
    const type = getFlowType(path.get('value'), typeParams);
    const propName = getPropertyName(path);
    if (!propName) return;

    const propDescriptor = documentation.getPropDescriptor(propName);
    propDescriptor.required = !path.node.optional;
    propDescriptor.flowType = type;

    // We are doing this here instead of in a different handler
    // to not need to duplicate the logic for checking for
    // imported types that are spread in to props.
    setPropDescription(documentation, path);
  } else if (path.isTSPropertySignature()) {
    const typeAnnotation = path.get('typeAnnotation');
    if (!typeAnnotation.hasNode()) {
      return;
    }
    const type = getTSType(typeAnnotation, typeParams);

    const propName = getPropertyName(path);
    if (!propName) return;

    const propDescriptor = documentation.getPropDescriptor(propName);
    propDescriptor.required = !path.node.optional;
    propDescriptor.tsType = type;

    // We are doing this here instead of in a different handler
    // to not need to duplicate the logic for checking for
    // imported types that are spread in to props.
    setPropDescription(documentation, path);
  }
}

/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 *
 * TODO either rename this handler or split in flow vs ts
 */
const flowTypeHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
): void {
  const typesPath = getTypeFromReactComponent(componentDefinition);

  if (!typesPath) {
    return;
  }

  applyToTypeProperties(
    documentation,
    typesPath,
    (propertyPath, typeParams) => {
      setPropDescriptor(documentation, propertyPath, typeParams);
    },
    null,
  );
};

export default flowTypeHandler;
