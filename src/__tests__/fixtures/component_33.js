import * as C31 from './component_32';
import PropTypes from 'prop-types';

export function SuperDuperCustomButton({color, ...otherProps}) {
  return <C31.SuperCustomButton {...otherProps} style={{color}} />;
}

SuperDuperCustomButton.propTypes = C31.sharedProps;
