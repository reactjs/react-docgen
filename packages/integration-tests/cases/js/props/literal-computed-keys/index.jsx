import PropTypes from 'prop-types';

export default function LiteralComputedKeys() {
  return <div />;
}

LiteralComputedKeys.propTypes = {
  ['text']: PropTypes.string,
  [2]: PropTypes.number,
  [true]: PropTypes.bool,
  [null]: PropTypes.any,
  [/pattern/]: PropTypes.instanceOf(RegExp),
};
