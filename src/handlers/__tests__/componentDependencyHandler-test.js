
/*global jest, describe, it, expect, beforeEach*/

jest.disableAutomock();
jest.mock('../../Documentation');

describe('componentDependencyHandler', () => {
  var statement, expression;
  var documentation;
  var componentDependencyHandler;

  beforeEach(() => {
    ({statement, expression} = require('../../../tests/utils'));

    documentation = new (require('../../Documentation'))();
    componentDependencyHandler = require('../componentDependencyHandler').default;
  });

  function test(getSrc, parse) {
    it('extracts dependencies', () => {
      var renderSrc = getSrc(`
        return React.createElement(SubComponent);
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponent']);
    });

    it('extracts dependencies with resolved root', () => {
      var renderSrc = getSrc(`
        var SubComponent = SubComponentx;
        return React.createElement(SubComponent);
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx']);
    });

    it('extracts dependencies with nested components', () => {
      var renderSrc = getSrc(`
        return React.createElement(SubComponentx, {
          children: React.createElement(SubComponenty)
        });
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx', 'SubComponenty']);
    });

    it('extracts dependencies with nested array components', () => {
      var renderSrc = getSrc(`
        return React.createElement(SubComponentx, {
          children: [
            React.createElement(SubComponenty),
            React.createElement(SubComponentz)
          ]
        });
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx', 'SubComponenty', 'SubComponentz']);
    });

    it('extracts dependencies with multi-level nested components', () => {
      var renderSrc = getSrc(`
        return React.createElement(SubComponentx, {
          children: React.createElement(SubComponenty, {
            children: React.createElement(SubComponentz)
          }),
        });
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx', 'SubComponenty', 'SubComponentz']);
    });

    it('extracts dependencies with duplicated components', () => {
      var renderSrc = getSrc(`
        return React.createElement(SubComponentx, {
          children: [
            React.createElement(SubComponenty),
            React.createElement(SubComponenty)
          ]
        });
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx', 'SubComponenty']);
    });

    it('extracts only react components', () => {
      var renderSrc = getSrc(`
        var randomVar = getRandomVar(random);
        return React.createElement(SubComponentx);
      `);

      documentation = new (require('../../Documentation'))();
      var definition = parse(renderSrc);

      componentDependencyHandler(documentation, definition);
      expect(documentation.dependencies).toEqual(['SubComponentx']);
    });
  }

  describe('React.createClass', () => {
    test(
      renderSrc => `({ render: function() {${renderSrc}} })`,
      src => statement(src).get('expression')
    );
  });

  describe('class definition', () => {
    test(
      renderSrc => `
        class Component {
          render() {
            ${renderSrc}
          }
        }
      `,
      src => statement(src)
    );
  });

  describe('stateless function', () => {
    test(
      renderSrc => `
        () => { ${renderSrc} }
      `,
      src => expression(src)
    );
  });

  it('does not error if there are no dependencies', () => {
    var definition = expression('{ render: function(){ return null } }');
    expect(() => componentDependencyHandler(documentation, definition))
      .not.toThrow();

    definition = statement('class Foo { render(){ return null } }');
    expect(() => componentDependencyHandler(documentation, definition))
      .not.toThrow();
  });
});
