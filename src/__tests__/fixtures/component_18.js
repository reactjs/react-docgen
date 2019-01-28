
import React from 'react';
import PropTypes from 'prop-types';
import extendStyles from 'enhancers/extendStyles';

type Props = $ReadOnly<{|
  color?: ?string,
|}>;

const ColoredView = React.forwardRef((props: Props, ref) => (
  <div ref={ref} style={{backgroundColor: props.color}} />
));

ColoredView.displayName = 'UncoloredView';
ColoredView.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string
}
ColoredView.defaultProps = {
  id: 'test-forward-ref-default'
}

module.exports = extendStyles(ColoredView);
