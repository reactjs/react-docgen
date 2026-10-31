import { getBody } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';
import getPropsMembers from '../getPropsMembers.js';

function getMembers(source: string) {
  const file = parseFile(source);
  const body = getBody(file);
  const exportPath = body.find(
    ({ node }) => node.type === 'ExportNamedDeclaration',
  );
  const declaration = exportPath?.get('declaration');
  const parameter =
    declaration && !Array.isArray(declaration)
      ? declaration.get('params')
      : null;
  const firstParameter = Array.isArray(parameter) ? parameter[0] : null;
  const typeAnnotation = firstParameter?.get('typeAnnotation');
  const annotation =
    typeAnnotation && !Array.isArray(typeAnnotation)
      ? typeAnnotation.get('typeAnnotation')
      : null;

  return annotation && !Array.isArray(annotation)
    ? getPropsMembers(file, annotation.node)
    : [];
}

test('resolves referenced interface members', () => {
  expect(
    getMembers(`
      interface Props { label: string; disabled?: boolean }
      export function View(props: Props) {}
    `).map((member) => member.type),
  ).toEqual(['TSPropertySignature', 'TSPropertySignature']);
});

test('handles circular interface inheritance', () => {
  expect(
    getMembers(`
      interface A extends B { a: number }
      interface B extends A { b: number }
      export function View(props: A) {}
    `).map((member) => member.key),
  ).toEqual([
    expect.objectContaining({ name: 'b' }),
    expect.objectContaining({ name: 'a' }),
  ]);
});

test('handles circular type aliases', () => {
  expect(
    getMembers(`
      type Foo<T> = Bar<T>;
      type Bar<T> = Foo<T>;
      export function View(props: Foo<string>) {}
    `),
  ).toEqual([]);
});
