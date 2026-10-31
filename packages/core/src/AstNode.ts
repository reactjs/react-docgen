export interface AstNode {
  readonly type: string;
  readonly [key: string]: unknown;
}

export type VisitorKeys = Readonly<Partial<Record<string, readonly string[]>>>;

export function isAstNode(value: unknown): value is AstNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}
