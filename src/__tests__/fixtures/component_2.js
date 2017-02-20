/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import React from 'react';

export class Button extends React.Component {
  static get displayName() {
    return "button";
  }

  static get defaultProps() {
    return {
      type: "primary",
    };
  }
}

export function foo() {
  return [].join();
}

export function chained() {
  return foo.bar().join();
}

export function templateLiteral() {
  return `foo bar`.split(' ');
}

export function withThis() {
  return this.foo();
}

export default function withNestedMemberExpressions() {
  return this.blub.blob.foo();
}
