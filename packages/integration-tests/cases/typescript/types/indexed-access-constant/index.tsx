import React from 'react';

export const STRING_VALS = [
  'one',
  'two',
  'three'
];

interface IProps {
  /**
   * String value of a number
   */
  value?: typeof STRING_VALS[number];
}

const MyComponent = (props: IProps) => {
  return (
    <div>
      {props.value}
    </div>
  );
}

export default MyComponent;
