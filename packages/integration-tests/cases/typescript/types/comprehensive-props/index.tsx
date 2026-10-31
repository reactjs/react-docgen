const status = 'ready' as const;

type Pair = [string, number];

interface Props {
  anything: any;
  unknownValue: unknown;
  text: string;
  count: number;
  enabled: boolean;
  literal: 'small';
  union: string | number;
  intersection: { left: string } & { right: number };
  list: string[];
  readonlyList: ReadonlyArray<number>;
  pair: Pair;
  callback: (value: string) => boolean;
  nested: { value?: string };
  record: Record<string, number>;
  status: typeof status;
  optional?: string;
}

/** Exercises TypeScript prop type extraction. */
export function TypeScriptTypes(_props: Props) {
  return <div />;
}
