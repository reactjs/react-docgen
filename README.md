# react-docgen

`react-docgen` is a CLI and toolbox to help extracting information from [React][] components, and generate documentation from it.

It uses [@babel/parser][] to parse the source into an AST and provides methods to process this AST to extract the desired information. The output / return value is a JSON blob / JavaScript object.

It provides a default implementation for React components defined via
`React.createClass`, [ES2015 class definitions][classes] or functions
(stateless components). These component definitions must follow certain
guidelines in order to be analyzable (see below for more info).

> react-docgen is a low level tool to extract information about react components. If you are searching for a more high level styleguide with nice interface try [react-styleguidist](https://github.com/styleguidist/react-styleguidist) or any of the other tools listed in the [wiki](https://github.com/reactjs/react-docgen/wiki).

## Documentation

For version 5.x please checkout the [README.md on the 5.x branch](https://github.com/reactjs/react-docgen/blob/5.x/README.md)

For version 6.x please checkout [react-docgen.dev](https://react-docgen.dev)

## License

This project is licensed under the MIT License.
