import React from 'react';

export default class JsDocVariants extends React.Component {
  /**
   * Converts flexible input.
   *
   * @param {string|Object|number[]} value Value to convert.
   * @param {string=} prefix Optional prefix.
   * @return Converted value.
   */
  convert(value, prefix = '') {
    return `${prefix}${String(value)}`;
  }

  /**
   * Accepts a typed tuple.
   *
   * @param {[string, number]} pair Tuple input.
   * @returns {[number, string]} Reversed tuple.
   */
  reverse(pair) {
    return [pair[1], pair[0]];
  }

  /**
   * Accepts any value.
   *
   * @param {*} value Any input.
   * @returns {*} Same value.
   */
  identity(value) {
    return value;
  }

  render() {
    return <div />;
  }
}
