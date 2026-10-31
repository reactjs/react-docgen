import { expect, test } from 'vitest';
import { isTSTypeReference, type AstNode } from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';
import getComposedTypeNames from '../getComposedTypeNames.js';

test('reports only unresolved interface compositions', () => {
  const file = parseFile(
    'interface Local {} interface Props extends Local, External {} function View(props: Props) {}',
  );
  const fn = file.ast.body[2];
  const annotation =
    fn?.params && Array.isArray(fn.params)
      ? fn.params[0]?.typeAnnotation?.typeAnnotation
      : null;

  expect(
    annotation &&
      typeof annotation === 'object' &&
      'type' in annotation &&
      isTSTypeReference(annotation as AstNode)
      ? getComposedTypeNames(file, annotation as AstNode)
      : [],
  ).toEqual(['External']);
});
