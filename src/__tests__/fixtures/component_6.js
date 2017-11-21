import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, onClick, style = {} }) => (
  <button
    style={{ }}
    onClick={onClick}
  >
    {children}
  </button>
);

Button.propTypes = {
  children: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default Button;
