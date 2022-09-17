import React from 'react';

interface IProps {
  /**
   * description of value
   */
  value: string;
}

function Hoc<T>(v: React.Component<T>) : React.Component<T> {
	return v;
}

class MyComponent extends Hoc(React.Component<IProps>) {
  render() {
    return <div className='s-c-z-example'/>;
  }
}
export default MyComponent;