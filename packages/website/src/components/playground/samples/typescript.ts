export default `interface Props {
  /** The name to greet */
  name: string
}

/**
 * Hello world component
 */
const MyComponent = ({name = 'world'}: Props) => {
  return <div />;
}`;
