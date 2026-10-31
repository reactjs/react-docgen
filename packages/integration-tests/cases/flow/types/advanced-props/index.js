// @flow

type NamedFunction = (
  count: number,
  label: ?string,
  ...rest: Array<string>
) => boolean;

type Callable = {
  (value: string): number,
  /** Values stored by key. */
  [key: string]: number,
  token: 'a' | 'b',
};

const sizes = { small: 's', large: 'l' };
type Shape = { left: string, right: number };

type Props = {
  namedFunction: NamedFunction,
  unnamedFunction: (number, ?string) => boolean,
  singleFunction: string => boolean,
  callable: Callable,
  tupleUnion: [string, number] | [number, string],
  intersection: { left: string } & { right: number },
  classType: Class<boolean>,
  optionalArray?: string[],
  keys: $Keys<typeof sizes>,
  qualified: React.Node,
  objectType: typeof sizes,
  indexed: Shape['left'],
  missingIndex: Shape['missing'],
};

/** Exercises advanced Flow prop type extraction. */
export function AdvancedFlowTypes(_props: Props) {
  return <div />;
}
