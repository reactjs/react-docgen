import * as React from "react";

type Props<T> = {
  segments: Array<T>,
};

export default class Segments<T> extends React.Component<Props<T>> {
  render(): React.Node {
    return null;
  }

  foo(props: Props<T>) {}
}
