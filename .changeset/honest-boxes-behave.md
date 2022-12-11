---
'react-docgen': major
---

Simplify `resolveObjectValuesToArray` and remove type handling. None of the code that was handling types was actually used.
The return values of `resolveObjectValuesToArray` are now in the order they are defined in the source code.
