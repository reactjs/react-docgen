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

## Tests and coverage

Run `pnpm test` for the package suites. Run `pnpm test:coverage` for the CI
coverage report at `coverage/lcov.info`. Coverage runs all package projects in
one Vitest process and resolves parser packages to their sources, so shared core
code exercised by adapter tests is included. The legacy coverage thresholds
remain enforced.

## Issues
We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue.

## License
react-docgen is [MIT licensed](https://github.com/reactjs/react-docgen/blob/master/LICENSE).

By contributing to react-docgen, you agree that your contributions will be licensed
under its MIT license.
