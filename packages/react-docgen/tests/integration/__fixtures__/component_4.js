/**
 * Testing computed argument passed to shape()
 */

import React from 'react';

var pt = React.PropTypes;

class Parent extends React.Component {
  static propTypes = {
    something: pt.string.isRequired,
    child: pt.shape(Child.propTypes).isRequired,
    extendedChild: pt.shape({
      ...Child.propTypes,
      adopted: pt.bool.isRequired
    }).isRequired,
    childExact: pt.exact(Child.propTypes).isRequired,
    extendedChildExact: pt.exact({
      ...Child.propTypes,
      adopted: pt.bool.isRequired
    }).isRequired
  };
}

export default Parent;
