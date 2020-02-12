import Button from './component_6';
import PropTypes from 'prop-types';

export function CustomButton({color, ...otherProps}) {
  return <Button {...otherProps} style={{color}} />;
}

CustomButton.propTypes = {
  ...Button.propTypes,
  color: PropTypes.string
};

export const sharedProps = Button.propTypes;
