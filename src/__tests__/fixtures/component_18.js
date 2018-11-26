
import React from 'react';
import extendStyles from 'enhancers/extendStyles';

type Props = $ReadOnly<{|
  color?: ?string,
|}>;

const ColoredView = React.forwardRef((props: Props, ref) => (
  <View style={{backgroundColor: props.color}} />
));

ColoredView.displayName = 'UncoloredView';

module.exports = extendStyles(ColoredView);