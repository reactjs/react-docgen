// @flow

/**
 * Test for documentation of flow class
 */

import React from 'react';
import type { ComponentType, ElementType, Node } from 'react';

type ProvidedProps = {
  classes: Object,
};

export type Props = {
  /**
   * Other base element props.
   */
  [otherProp: string]: any,
  /**
   * Useful to extend the style applied to components.
   */
  classes?: Object,
  /**
   * @ignore
   */
  children?: Node,
  /**
   * The component used for the root node.
   * This currently has to be flow cast in defaultProps as of flow 0.59.0
   */
  component: ElementType,
  /**
   * Shadow depth, corresponds to `dp` in the spec.
   * It's accepting values between 0 and 24 inclusive.
   */
  elevation: number,
  /**
   * Useful to customize the rows per page label. Invoked with a `{ from, to, count, page }`
   * object.
   */
  labelRowsPerPage: Node,
  /**
   * Transition component.
   */
  transition: ComponentType<*>,
};

class Paper extends React.Component<ProvidedProps & Props> {
  static defaultProps = {
    labelRowsPerPage: ('Rows per page:': Node),
    component: ('div': ElementType),
    elevation: 2,
  };

  render() {
    const {
      classes,
      component: ComponentProp,
      transition,
      ...other
    } = this.props;

    return <ComponentProp className={classes.root} transition={transition} {...other} />;
  }
}

export default Paper;
