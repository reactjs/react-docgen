/*global jasmine*/

var recast = require('recast');

var matchers = {
  toEqualASTNode: function compare(expected) {
    if (!expected || typeof expected !== 'object') {
      throw new Error(
        'Expected value must be an object representing an AST node.\n' +
        'Got ' + expected + '(' + typeof expected + ') instead.'
      );
    }

    return recast.types.astNodesAreEquivalent(this.actual, expected);
  },
};


jasmine.getEnv().beforeEach(function() {
  this.addMatchers(matchers);
});
