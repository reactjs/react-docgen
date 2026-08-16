import PropTypes from 'prop-types';

const source = {
  label: 'from-variable-pattern',
  count: 7,
};
const { label } = source;
let count;

({ count } = source);

export default function DestructuredBindings() {
  return <div />;
}

DestructuredBindings.propTypes = {
  label: PropTypes.string,
  count: PropTypes.number,
};

DestructuredBindings.defaultProps = {
  label,
  count,
};
