// @flow

/**
 * Test for documentation of flow class
 */

import React from 'react';
import type { ComponentType, ElementType, Node } from 'react';

type ProvidedProps = {
  classes: Object,
};

export type Origin = {
  horizontal: 'left' | 'center' | 'right' | number,
  vertical: 'top' | 'center' | 'bottom' | number,
};

export type Props = {
  /**
   * Other base element props.
   */
  [otherProp: string]: any,
  /**
   * This is the point on the anchor where the popover's
   * `anchorEl` will attach to. This is not used when the
   * anchorReference is 'anchorPosition'.
   *
   * Options:
   * vertical: [top, center, bottom];
   * horizontal: [left, center, right].
   */
  anchorOrigin?: Origin,
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
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'left',
    },
    labelRowsPerPage: ('Rows per page:': Node),
    component: ('div': ElementType),
    component: 'div',
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
