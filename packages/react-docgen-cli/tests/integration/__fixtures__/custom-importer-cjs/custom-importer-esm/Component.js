const React = require('react');
import x from './other.cjs';

function Component() {
  return <div />;
};

Component.displayName = x

module.exports = Component
