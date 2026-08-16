import * as C36 from './component_36.js';
import PropTypes from 'prop-types';

export function SuperDuperCustomButton({color, ...otherProps}) {
  return <C36.SuperCustomButton {...otherProps} style={{color}} />;
}

SuperDuperCustomButton.propTypes = C36.sharedProps;
export {SuperCustomButton} from './component_36.js';
