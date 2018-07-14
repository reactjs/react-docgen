const propTypes = {
  /** This does something. */
  bar: PropTypes.node,
};

export default function Foo(props) {
  return <div />;
}

Foo.propTypes = {
  ...propTypes
};

Foo.defaultProps = {
  bar: null,
};