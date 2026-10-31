import React from 'react';
import PropTypes from 'prop-types';

const AssignedClass = class extends React.Component {
  render() {
    return <div />;
  }
};

AssignedClass.propTypes = {
  /** Visible text. */
  label: PropTypes.string.isRequired,
};
AssignedClass.defaultProps = { label: 'default' };
AssignedClass.displayName = 'AssignedClassDisplayName';

export default AssignedClass;
