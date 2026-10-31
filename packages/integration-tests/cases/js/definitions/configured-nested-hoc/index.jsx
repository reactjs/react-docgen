import PropTypes from 'prop-types';

const withOuterConfiguration = (..._arguments) => null;
const withInnerConfiguration = (..._arguments) => null;

function NestedHocBase() {
  return <div />;
}

NestedHocBase.propTypes = {
  /** Base value. */
  value: PropTypes.string.isRequired,
};

export default withOuterConfiguration(
  { enabled: true },
  withInnerConfiguration('configured', NestedHocBase),
);
