interface Props {
  name: (() => string) | undefined;
}

export const MyComponent = ({ name }: Props) => <div />;
