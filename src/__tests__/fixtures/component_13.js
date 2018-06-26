/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * Test for documentation of React components with Flow annotations for props.
 */

import React from 'react';

type AlignProps = {|
  +align?: "left" | "center" | "right" | "justify",
  +left?: boolean,
  +center?: boolean,
  +right?: boolean,
  +justify?: boolean,
|};

type TransformProps = {|
  +transform?: "lowercase" | "uppercase" | "capitalize",
  +lowercase?: boolean,
  +uppercase?: boolean,
  +capitalize?: boolean,
|};

type TrackingProps = {|
  +tracking?: "tight" | "normal" | "wide",
  +trackingTight?: boolean,
  +trackingNormal?: boolean,
  +trackingWide?: boolean,
|};

type LeadingProps = {|
  +leading?: "none" | "tight" | "normal" | "loose",
  +leadingNone?: boolean,
  +leadingTight?: boolean,
  +leadingNormal?: boolean,
  +leadingLoose?: boolean,
|};

type TextProps = {|
  ...AlignProps,
  ...TransformProps,
  ...TrackingProps,
  ...LeadingProps,
  +children?: React.Node,
  +className?: string,
  +RootComponent?: React.ElementType,
  +color?: string,
  +size?: string,
  +wrap?: boolean,
  +muted?: boolean,
|};

class Foo extends React.Component<TextProps> {
   render() {
       return <div />;
   }
}

export default Foo;