---
'react-docgen': minor
---

Add the new ChainResolver which allows multiple resolvers to be chained.

```ts
import { builtinResolvers } from 'react-docgen';

const { ChainResolver } = builtinResolvers;
const resolver = new ChainResolver([resolver1, resolver2], {
  chainingLogic: ChainResolver.Logic.ALL, // or ChainResolver.Logic.FIRST_FOUND,
});
```
