declare module 'hermes-parser' {
  export const FlowVisitorKeys: Record<string, readonly string[]>;
  export function parse(
    code: string,
    options: {
      flow: 'all' | 'detect';
      sourceType: 'module' | 'script' | 'unambiguous';
      tokens?: boolean;
    },
  ): unknown;
}
