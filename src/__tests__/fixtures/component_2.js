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
