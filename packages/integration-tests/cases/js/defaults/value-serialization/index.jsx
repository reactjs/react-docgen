import PropTypes from 'prop-types';

const shared = {
  spreadValue: 'shared',
};

export default function ValueSerialization() {
  return <div />;
}

ValueSerialization.propTypes = {
  text: PropTypes.string,
  count: PropTypes.number,
  disabled: PropTypes.bool,
  empty: PropTypes.any,
  pattern: PropTypes.instanceOf(RegExp),
  big: PropTypes.any,
  list: PropTypes.array,
  object: PropTypes.object,
  member: PropTypes.any,
  called: PropTypes.any,
  spreadValue: PropTypes.string,
};

ValueSerialization.defaultProps = {
  text: 'value',
  count: -2,
  disabled: false,
  empty: null,
  pattern: /value/gi,
  big: 2n,
  list: ['one', 2, null],
  object: { nested: true, method() {} },
  member: globalThis.location,
  called: String(42),
  ...shared,
};
