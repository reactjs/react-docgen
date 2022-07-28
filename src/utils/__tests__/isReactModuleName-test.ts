import isReactModuleName from '../isReactModuleName';

describe('isReactModuleName', () => {
  const reactModules = [
    'react',
    'react/addons',
    'react-native',
    'proptypes',
    'prop-types',
  ];

  reactModules.forEach(module => {
    it(`returns true for ${module}`, () => {
      expect(isReactModuleName(module)).toBe(true);
    });
  });

  it(`returns false by default`, () => {
    expect(isReactModuleName('not-react')).toBe(false);
  });
});
