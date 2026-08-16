import React from "react";

type Identity<T> = T;

type Props<T> = {
  prop: Identity<T>,
}

export default function MyComponent<T>(props: Props<T>) {
  return <div>Hello World</div>
}
