import React from 'react';

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

Button.childContextTypes = {
  color: React.PropTypes.string,
};

Button.contextTypes = {
  config: React.PropTypes.object,
};

export default Button;
