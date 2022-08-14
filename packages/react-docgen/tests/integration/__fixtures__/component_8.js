/**
 * Testing array parameter destructuring.
 */

import React from 'react';

var pt = React.PropTypes;

class Parent extends React.Component {
  onChangeSlider([min, max]) {
    this.setState({ min, max });
  }
}

export default Parent;
