declare module 'hermes-parser' {
  export interface ParserOptions {
    flow: 'all' | 'detect';
    sourceType: 'module' | 'script' | 'unambiguous';
    tokens?: boolean;
  }

  export const FlowVisitorKeys: Record<string, readonly string[]>;
  export function parse(code: string, options: ParserOptions): unknown;
}
