import Other from 'other';

interface Props {
  /** description of value */
  value: string;
}

interface Options {
  unrelated: number;
}

export default class MyComponent extends makeComponent(
  Other.Component<Options>,
) {
  props: Props;
  render() {
    return <div />;
  }
}
