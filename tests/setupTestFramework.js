/*global jasmine*/

var recast = require('recast');

var matchers = {
  toEqualASTNode: function () {
    return {
      compare: function (actual, expected) {
        if (!expected || typeof expected !== 'object') {
          throw new Error(
            'Expected value must be an object representing an AST node.\n' +
            'Got ' + expected + '(' + typeof expected + ') instead.'
          );
        }

        return {pass: recast.types.astNodesAreEquivalent(actual, expected)};
      }
    };
  }
};


jasmine.getEnv().beforeEach(function() {
  jasmine.addMatchers(matchers);
});
