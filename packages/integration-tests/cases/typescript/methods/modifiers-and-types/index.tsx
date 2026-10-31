import React from 'react';

interface Props {
  value: string;
}

export default class TypedMethods extends React.Component<Props> {
  /** Static helper. */
  static utility(value: number): string {
    return String(value);
  }

  /** Loads one value. */
  async load(value: string): Promise<string> {
    return value;
  }

  /** Produces values. */
  *items(count: number): Generator<number> {
    yield count;
  }

  /** Computed method. */
  ['computed'](enabled?: boolean): boolean {
    return enabled ?? false;
  }

  /** Arrow property. */
  arrow = (value: number): string => String(value);

  render() {
    return <div />;
  }
}
