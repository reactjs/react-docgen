import React, {memo, forwardRef} from 'react';

export default memo(forwardRef(({ foo = 'bar' }, ref) => <div ref={ref}>{foo}</div>));