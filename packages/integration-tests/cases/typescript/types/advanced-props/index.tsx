import type * as React from 'react';

const values = { first: 'one', second: 'two' } as const;
type Values = typeof values;
type Action = { subAction?: Action };

interface IndexedInterface {
  x: string;
}

interface Callable {
  (value: string): number;
  [key: string]: unknown;
  method(value: number): void;
}

interface Props {
  keys: keyof Values;
  value: Values[keyof Values];
  mapped: { [Key in keyof Values]?: Values[Key] };
  children: React.ReactNode;
  component: React.ComponentType<{ enabled: boolean }>;
  callable: Callable;
  rest: (...values: string[]) => void;
  neverValue: never;
  nullValue: null;
  undefinedValue: undefined;
  symbolValue: symbol;
  objectValue: object;
  action: Action;
  interfaceIndex: IndexedInterface['x'];
  qualifiedTypeof: typeof values.first;
  inlineKeys: keyof { apple: string; banana: string };
  ref: React.Ref<typeof AdvancedTypeScriptTypes>;
  childrenArray: React.ChildrenArray<string>;
}

/** Exercises advanced TypeScript prop type extraction. */
export function AdvancedTypeScriptTypes(_props: Props) {
  return <div />;
}
