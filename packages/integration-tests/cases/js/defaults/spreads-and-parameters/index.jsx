import PropTypes from 'prop-types';

const sharedDefaults = {
  theme: 'light',
};

export function Button({ label = 'Fallback', size = 1 }) {
  return <button data-size={size}>{label}</button>;
}

Button.propTypes = {
  label: PropTypes.string,
  size: PropTypes.number,
  theme: PropTypes.string,
};

Button.defaultProps = {
  ...sharedDefaults,
  label: 'Save',
};
