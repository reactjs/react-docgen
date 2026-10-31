import PropTypes from 'prop-types';

const customValidator = () => null;
const sharedValidators = {
  shared: PropTypes.string,
  requiredShared: PropTypes.number.isRequired,
};

export default function ComposedValidators() {
  return <div />;
}

ComposedValidators.propTypes = {
  ...sharedValidators,
  custom: customValidator,
  nested: PropTypes.exact({
    shape: PropTypes.shape({
      enabled: PropTypes.bool.isRequired,
      values: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ])),
    }).isRequired,
  }),
};
