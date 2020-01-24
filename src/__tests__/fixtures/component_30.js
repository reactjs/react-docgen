import React from "react";

type Identity<T> = T;

type Props = {
  prop: Identity<string>,
}

export default function MyComponent(props: Props) {
  return <div>Hello World</div>
}
