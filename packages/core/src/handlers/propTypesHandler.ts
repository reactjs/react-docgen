import {
  isAssignmentExpression,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  type FileState,
  type Handler,
} from '../internal.js';
import getBody from '../utils/getBody.js';
import getComponentName from '../utils/getComponentName.js';
import getDescription from '../utils/getDescription.js';
import getPropType from '../utils/getPropType.js';
import getObjectProperties from '../utils/getObjectProperties.js';
import getMemberName from '../utils/getMemberName.js';
import getPropertyName from '../utils/getPropertyName.js';
import resolveValue from '../utils/resolveValue.js';
import getClassStaticValue from '../utils/getClassStaticValue.js';
import getResolvedEnumValues from '../utils/getResolvedEnumValues.js';
import unwrapExpression from '../utils/unwrapExpression.js';

function hasPropTypesImport(file: FileState): boolean {
  let found = false;

  file.traverse(
    {
      ImportDeclaration(path) {
        const source = path.get('source');

        if (!source || Array.isArray(source) || !isLiteral(source.node)) return;
        if (source.node.value === 'prop-types') {
          found = true;
        } else if (source.node.value === 'react') {
          const specifiers = path.get('specifiers');

          found =
            Array.isArray(specifiers) &&
            specifiers.some((specifier) => {
              if (specifier.node.type !== 'ImportSpecifier') return false;
              const imported = specifier.get('imported');

              return Boolean(
                imported &&
                !Array.isArray(imported) &&
                isIdentifier(imported.node, { name: 'PropTypes' }),
              );
            });
        }
        if (found) path.stop();
      },
      CallExpression(path) {
        if (
          !isCallExpression(path.node) ||
          !isIdentifier(path.node.callee, { name: 'require' })
        )
          return;
        const [source] = path.node.arguments;

        if (source && isLiteral(source) && source.value === 'prop-types') {
          found = true;
          path.stop();
        }
      },
    },
    undefined,
  );

  return found;
}

const propTypesHandler: Handler = (documentation, path, file) => {
  const componentName = getComponentName(path);

  if (!componentName) {
    return;
  }

  const staticPropTypes = getClassStaticValue(file, path, 'propTypes');
  const propTypesObjects = staticPropTypes ? [staticPropTypes] : [];

  for (const statement of getBody(file)) {
    if (!isExpressionStatement(statement.node)) {
      continue;
    }

    const assignment = statement.node.expression;

    if (
      !isAssignmentExpression(assignment) ||
      assignment.operator !== '=' ||
      !isMemberExpression(assignment.left) ||
      assignment.left.computed ||
      !isIdentifier(unwrapExpression(assignment.left.object), {
        name: componentName,
      }) ||
      !isIdentifier(assignment.left.property, { name: 'propTypes' })
    ) {
      continue;
    }

    propTypesObjects.push(assignment.right);
  }

  if (propTypesObjects.length === 0) return;
  const importedPropTypes = hasPropTypesImport(file);

  for (const propTypesObject of propTypesObjects) {
    for (const property of getObjectProperties(file, propTypesObject)) {
      const keyName = getPropertyName(property.key);
      const propertyName =
        keyName && property.computed && isIdentifier(property.key)
          ? `@computed#${keyName}`
          : keyName;

      if (!propertyName) continue;

      const propType = getPropType(
        property.value,
        (node) => getDescription(file, node),
        (node) =>
          Array.isArray(node.range)
            ? file.source.code.slice(node.range[0], node.range[1])
            : '',
      );

      const resolvedValue = resolveValue(file, property.value);
      const raw = Array.isArray(resolvedValue.range)
        ? file.source.code.slice(resolvedValue.range[0], resolvedValue.range[1])
        : '';

      if (!propType) {
        documentation.props ??= {};
        documentation.props[propertyName] = {
          description: getDescription(file, property),
          required: false,
          type: { name: 'custom', raw },
        };
        continue;
      }

      documentation.props ??= {};
      const memberName = getMemberName(property.value);
      const enumValues = getResolvedEnumValues(file, property.value);
      const type = enumValues
        ? { name: 'enum', value: enumValues }
        : memberName?.startsWith('PropTypes.') && !importedPropTypes
          ? {
              name: 'custom',
              raw,
            }
          : propType.type;

      documentation.props[propertyName] = {
        description: getDescription(file, property),
        required: propType.required,
        type,
      };
    }
  }
};

export default propTypesHandler;
