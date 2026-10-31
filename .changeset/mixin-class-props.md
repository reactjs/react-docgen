---
'react-docgen': patch
'@react-docgen/typescript': patch
---

Extract TypeScript props from React class components extending mixin calls,
including aliased component bases and wrapped props. Preserve declared props
when a mixin receives unrelated generic arguments.

Ported from [#1145](https://github.com/reactjs/react-docgen/pull/1145) by
[@mfazekas](https://github.com/mfazekas), merged with follow-up fixes in
[#1157](https://github.com/reactjs/react-docgen/pull/1157). Shared regression
fixtures cover the legacy parser, TypeScript adapter, and TypeScript handlers
composed with the normalized Babel adapter.
