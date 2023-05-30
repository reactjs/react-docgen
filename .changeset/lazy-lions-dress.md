---
'react-docgen': major
---

Removed match utility.

The utility can be replaced by babel helpers and is not needed anymore. Also
using explicit checks like `path.isMemberExpression()` is better for type safety
and catching potential bugs.
