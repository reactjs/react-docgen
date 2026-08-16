import React from 'react';

export default class ParameterShapes extends React.Component {
  /**
   * Exercise every public method parameter shape.
   *
   * @param {number} count Item count.
   * @param {object} options Named options.
   * @param {Array} pair Tuple-like input.
   * @param {...string} labels Remaining labels.
   * @returns {string} Combined value.
   */
  format(count = 0, { enabled }, [first], ...labels) {
    return `${count}:${enabled}:${first}:${labels.join(',')}`;
  }

  render() {
    return <div />;
  }
}
