---
'react-docgen': minor
---

Add codes to errors to be able to easily detect them

There is a new export `ERROR_CODES` that contains all possible error codes.
The two errors that have codes right now are:

- `MISSING_DEFINITION`: No component found in a file
- `MULTIPLE_DEFINITIONS`: Multiple components found in one file
