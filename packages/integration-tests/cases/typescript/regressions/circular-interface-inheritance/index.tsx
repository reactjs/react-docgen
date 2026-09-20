interface A extends B {
  a: number;
}

interface B extends A {
  b: number;
}

export function Component(props: A) {
  return <div />;
}
