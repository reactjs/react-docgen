const testImporter = function (pa, n, file) {
  const newFile = file.parse('("importer")', 'x.js');

  let path;
  newFile.traverse({
    Program(p) {
      path = p;
      p.stop();
    }
  });

  return path.get('body')[0].get('expression');
};

module.exports =  testImporter;
