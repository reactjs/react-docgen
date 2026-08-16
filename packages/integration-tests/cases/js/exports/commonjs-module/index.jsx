const PropTypes = require('prop-types');

function CommonJsButton({ label }) {
  return <button>{label}</button>;
}

CommonJsButton.propTypes = {
  label: PropTypes.string.isRequired,
};

module.exports = CommonJsButton;
