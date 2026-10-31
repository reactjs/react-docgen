import PropTypes from 'prop-types';
import defaults, { choices } from './values.js';

export default function ImportedDefaultsAndEnums() {
  return <div />;
}

ImportedDefaultsAndEnums.propTypes = {
  label: PropTypes.string,
  count: PropTypes.number,
  choice: PropTypes.oneOf(Object.values(choices)),
};

ImportedDefaultsAndEnums.defaultProps = {
  ...defaults,
  choice: choices.primary,
};
