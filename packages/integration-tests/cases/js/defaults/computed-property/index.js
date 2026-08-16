import React from 'react';
import PropTypes from 'prop-types';

const Button = () => (
  <div></div>
);

Button.propTypes = {
  /** This is a test */
  [children]: PropTypes.string.isRequired,
};

Button.defaultProps = {
  [children]: "default",
};

export default Button;
