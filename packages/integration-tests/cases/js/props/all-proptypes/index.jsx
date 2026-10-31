import PropTypes from 'prop-types';

class Model {}

export default function PropTypeShowcase() {
  return <div />;
}

PropTypeShowcase.propTypes = {
  anything: PropTypes.any,
  list: PropTypes.arrayOf(PropTypes.string).isRequired,
  enabled: PropTypes.bool,
  callback: PropTypes.func,
  count: PropTypes.number,
  model: PropTypes.instanceOf(Model),
  choice: PropTypes.oneOf(['small', 'large']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  values: PropTypes.objectOf(PropTypes.number),
  node: PropTypes.node,
  element: PropTypes.element,
  elementType: PropTypes.elementType,
  shape: PropTypes.shape({ nested: PropTypes.bool.isRequired }),
  exact: PropTypes.exact({ id: PropTypes.number }),
};
