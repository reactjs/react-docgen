import type { NodePath } from '@babel/traverse';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import { parse } from '../../../tests/utils';
import resolveExportDeclaration from '../resolveExportDeclaration';

jest.mock('../resolveToValue', () => {
  return (path: NodePath) => path;
});

describe('resolveExportDeclaration', () => {
  it('resolves default exports', () => {
    const exp = parse.statement<ExportDefaultDeclaration>('export default 42;');
    const resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named variable exports', () => {
    const exp = parse.statement<ExportNamedDeclaration>(
      'export var foo = 42, bar = 21;',
    );
    const resolved = resolveExportDeclaration(exp);

    const declarations = exp.get('declaration').get('declarations');
    expect(resolved).toEqual([declarations[0], declarations[1]]);
  });

  it('resolves named function exports', () => {
    const exp = parse.statement<ExportNamedDeclaration>(
      'export function foo(){}',
    );
    const resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named class exports', () => {
    const exp = parse.statement<ExportNamedDeclaration>('export class Foo {}');
    const resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([exp.get('declaration')]);
  });

  it('resolves named exports', () => {
    const exp = parse.statement<ExportNamedDeclaration>(
      'export {foo, bar, baz}; var foo, bar, baz;',
    );
    const resolved = resolveExportDeclaration(exp);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([
      specifiers[0].get('local'),
      specifiers[1].get('local'),
      specifiers[2].get('local'),
    ]);
  });

  it('resolves named exports from', () => {
    const exp = parse.statement<ExportNamedDeclaration>(
      'export {foo, bar, baz} from "";',
    );
    const resolved = resolveExportDeclaration(exp);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([
      specifiers[0].get('local'),
      specifiers[1].get('local'),
      specifiers[2].get('local'),
    ]);
  });
});
