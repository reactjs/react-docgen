---
'react-docgen': minor
---

Allow resolvers to be classes in addition to functions.

```ts
import type { ResolverClass, ResolverFunction } from 'react-dcogen';

// This was the only option until now
const functionResolver: ResolverFunction = (file: FileState) => {
  //needs to return array of found components
};

// This is the new class resolver
class MyResolver implements ResolverClass {
  resolve(file: FileState) {
    //needs to return array of found components
  }
}

const classResolver = new MyResolver();
```
