import React, { PropTypes } from 'react';
import extendStyles from 'enhancers/extendStyles';

const Test = props =>
  <div style={props.style}>
    Hello world!
  </div>;

Test.propTypes = {
  style: PropTypes.object,
};

export default extendStyles(Test);
