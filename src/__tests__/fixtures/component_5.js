import React from 'react';

const RANDOM_VALUE = 2 ** 2;

const Button = ({ children, onClick, style = {} }) => (
  <button
    style={{ }}
    onClick={onClick}
  >
    {children}
  </button>
);

Button.propTypes = {
  children: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func,
  style: React.PropTypes.object,
};

export default Button;
