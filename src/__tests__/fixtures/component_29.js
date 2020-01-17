import React from 'react';
import PropTypes from 'prop-types';
import { forbidExtraProps } from "airbnb-prop-types";

const Test = () => <div />;

Test.propTypes = forbidExtraProps({
  foo: PropTypes.string,
});

export default Test;
