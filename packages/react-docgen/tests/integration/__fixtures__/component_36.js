import {SuperCustomButton, sharedProps} from './component_35.js';
import PropTypes from 'prop-types';

export function SuperDuperCustomButton({color, ...otherProps}) {
  return <SuperCustomButton {...otherProps} style={{color}} />;
}

SuperDuperCustomButton.propTypes = sharedProps;
export * from './component_35.js';
