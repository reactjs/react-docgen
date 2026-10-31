import PropTypes from 'prop-types';

const base = {
  alpha: 'alpha',
  2: 2,
};

const extended = {
  ...base,
  get gamma() {
    return 'gamma';
  },
};

export function ObjectEnums() {
  return <div />;
}

ObjectEnums.propTypes = {
  key: PropTypes.oneOf(Object.keys(extended)),
  value: PropTypes.oneOf(Object.values({ ...base, enabled: true })),
};
