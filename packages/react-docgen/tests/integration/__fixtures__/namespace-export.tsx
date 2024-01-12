import * as React from 'react';

interface IProps {
  value: string;
}

export default class extends React.Component<IProps> {
  render() {
    return <div/>;
  }
}

export * as namespace from "./support/other-exports.js";
