import { Sizes } from '../common.js';
import T from 'prop-types';

function SuperDuperCustomButton() {
  return <div />;
}

SuperDuperCustomButton.defaultProps = {
  size: Sizes.EXTRA_LARGE,
};

SuperDuperCustomButton.propTypes = {
  size: T.oneOf(Object.values(Sizes)),
};

export default SuperDuperCustomButton;
