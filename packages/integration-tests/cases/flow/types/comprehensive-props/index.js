// @flow

type Props = {
  anything: any,
  mixedValue: mixed,
  text: string,
  count: number,
  enabled: boolean,
  literal: 'small',
  union: string | number,
  maybe: ?string,
  list: Array<string>,
  pair: [string, number],
  callback: (value: string) => boolean,
  nested: { value?: string },
  optional?: string,
};

/** Exercises Flow prop type extraction. */
export function FlowTypes(_props: Props) {
  return <div />;
}
