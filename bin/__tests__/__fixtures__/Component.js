const React = require('react');
const Foo = require('Foo');

/**
 * General component description.
 */
const Component = React.createClass({
  displayName: 'Component',

  propTypes: {
    ...Foo.propTypes,
    /**
     * Prop description
     */
    bar: React.PropTypes.number,
  },

  getDefaultProps: function () {
    return {
      bar: 21,
    };
  },

  render: function () {
    // ...
  },
});

module.exports = Component;
