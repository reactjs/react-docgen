type Foo<T> = Bar<T>;
type Bar<T> = Foo<T>;

export function Component(props: Foo<string>) {
  return <div />;
}
