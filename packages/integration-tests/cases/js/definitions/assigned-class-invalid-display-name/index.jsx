import React from 'react';
import PropTypes from 'prop-types';

let Assigned;

Assigned = class extends React.Component {
  render() {
    return <div />;
  }
};

Assigned.propTypes = {
  value: PropTypes.number,
};
Assigned.displayName = true;

export default Assigned;
