# Contributing to react-docgen
We want to make contributing to this project as easy and transparent as
possible.

## Our Development Process
The majority of development on react-docgen will occur through GitHub. Accordingly,
the process for contributing will follow standard GitHub protocol.

## Pull Requests
We actively welcome your pull requests.
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints and typechecks.

## Babel compatibility tests

CI runs all library and CLI tests separately with Babel 7 and Babel 8.
Both runs build with the declared Babel 7 dependencies first. The Babel 8
run then replaces the runtime dependencies, including those used by CLI
subprocesses. This checks runtime compatibility, not compilation with Babel 8 types.

To reproduce the Babel 8 run in a clean checkout:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm --filter react-docgen add --save-exact @babel/core@8.0.1 @babel/traverse@8.0.4 @babel/types@8.0.4
pnpm --filter react-docgen --filter @react-docgen/cli --parallel --no-bail test --coverage
```

The install command changes `packages/react-docgen/package.json` and
`pnpm-lock.yaml`. After testing, restore those two files and run
`pnpm install --frozen-lockfile` to return to Babel 7.

## Issues
We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue.

## License
react-docgen is [MIT licensed](https://github.com/reactjs/react-docgen/blob/master/LICENSE).

By contributing to react-docgen, you agree that your contributions will be licensed
under its MIT license.
