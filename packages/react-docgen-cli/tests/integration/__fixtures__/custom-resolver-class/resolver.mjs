const code = `
  ({
    displayName: 'Custom',
  })
`;

const customResolver = class {
  resolve(file) {
    const newFile = file.parse(code, 'x.js');
    let path;

    newFile.traverse({
      Program(p) {
        path = p;
        p.stop();
      }
    });

    return [path.get('body')[0].get('expression')];
  }
}

const resolver = new customResolver();

export default resolver;
