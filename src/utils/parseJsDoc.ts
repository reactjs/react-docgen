import doctrine, { Type } from 'doctrine';
import type { Annotation, Tag } from 'doctrine';

type ExcludesNullish = <T>(x: T | null | undefined | false | 0) => x is T;
type JsDocType = JsDocBaseType | JsDocElementsType;

interface JsDocBaseType {
  name: string;
}

interface JsDocElementsType extends JsDocBaseType {
  elements: JsDocType[];
}

interface JsDocProperty {
  description: string | null;
  type: JsDocType | null;
}
interface JsDocParam extends JsDocProperty {
  name: string;
  optional?: boolean;
}

interface JsDoc {
  description: string | null;
  params: JsDocParam[];
  returns: JsDocProperty | null;
}

function getType(tagType: Type | undefined | null): JsDocType | null {
  if (!tagType) {
    return null;
  }

  switch (tagType.type) {
    case 'NameExpression':
      // {a}
      return { name: tagType.name };
    case 'UnionType':
      // {a|b}
      return {
        name: 'union',
        elements: tagType.elements
          .map(element => getType(element))
          .filter(Boolean as unknown as ExcludesNullish),
      };
    case 'AllLiteral':
      // {*}
      return { name: 'mixed' };
    case 'TypeApplication':
      // {Array<string>} or {string[]}
      return {
        name: 'name' in tagType.expression ? tagType.expression.name : '',
        elements: tagType.applications
          .map(element => getType(element))
          .filter(Boolean as unknown as ExcludesNullish),
      };
    case 'ArrayType':
      // {[number, string]}
      return {
        name: 'tuple',
        elements: tagType.elements
          .map(element => getType(element))
          .filter(Boolean as unknown as ExcludesNullish),
      };
    default: {
      const typeName =
        'name' in tagType && tagType.name
          ? tagType.name
          : 'expression' in tagType &&
            tagType.expression &&
            'name' in tagType.expression
          ? tagType.expression.name
          : null;
      if (typeName) {
        return { name: typeName };
      } else {
        return null;
      }
    }
  }
}

function getOptional(tag: Tag): boolean {
  return !!(tag.type && tag.type.type && tag.type.type === 'OptionalType');
}

// Add jsdoc @return description.
function getReturnsJsDoc(jsDoc: Annotation): JsDocProperty | null {
  const returnTag = jsDoc.tags.find(
    tag => tag.title === 'return' || tag.title === 'returns',
  );
  if (returnTag) {
    return {
      description: returnTag.description,
      type: getType(returnTag.type),
    };
  }
  return null;
}

// Add jsdoc @param descriptions.
function getParamsJsDoc(jsDoc: Annotation): JsDocParam[] {
  if (!jsDoc.tags) {
    return [];
  }
  return jsDoc.tags
    .filter(tag => tag.title === 'param')
    .map(tag => {
      return {
        name: tag.name || '',
        description: tag.description,
        type: getType(tag.type),
        optional: getOptional(tag),
      };
    });
}

export default function parseJsDoc(docblock: string): JsDoc {
  const jsDoc = doctrine.parse(docblock);

  return {
    description: jsDoc.description || null,
    params: getParamsJsDoc(jsDoc),
    returns: getReturnsJsDoc(jsDoc),
  };
}
