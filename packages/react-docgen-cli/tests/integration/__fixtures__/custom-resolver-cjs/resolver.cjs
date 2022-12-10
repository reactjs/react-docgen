const code = `
  ({
    displayName: 'Custom',
  })
`;

const customResolver = function (
  file,
) {
  const newFile = file.parse(code, 'x.js');
  let path;

  newFile.traverse({
    Program(p) {
      path = p;
      p.stop();
    }
  });

  return [path.get('body')[0].get('expression')];
};

module.exports = customResolver;
