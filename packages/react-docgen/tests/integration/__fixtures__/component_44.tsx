import React, { useRef, useImperativeHandle, forwardRef } from 'react';

type Props = {
  align?: "left" | "center" | "right" | "justify"
};

/**
 * This is a TypeScript function component
 */
function FancyInput(props: Props, ref) {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    /** this is a method on a component */
    focus: () => {
      inputRef.current.focus()
    }
  }));
  return <input ref={inputRef} />;
}

export default forwardRef(FancyInput);
