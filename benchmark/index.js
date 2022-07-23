const fs = require('fs');
const path = require('path');
const Table = require('cli-table');
const Benchmark = require('benchmark');
const { parse } = require('..');
const { parse: parse5 } = require('react-docgen5');
const { parse: parse6old } = require('react-docgen6pre');

console.log(`Node: ${process.version}`);

const head = ['fixture', 'current', 'v6.0.0-alpha.3', 'v5.4.3'];

const files = ['./fixtures/CircularProgress.js'];

const table = new Table({
  head,
  style: {
    head: ['bold'],
  },
});

if (!global.gc) {
  console.error(
    'Garbage collection unavailable.  Pass --expose-gc ' +
      'when launching node to enable forced garbage collection.',
  );
  process.exit();
}

files.forEach(file => {
  const code = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  const suite = new Benchmark.Suite(file.replace(/\.\/fixtures\//, ''));
  const options = { filename: file, babelrc: false, configFile: false };

  // warmup
  parse(code, undefined, undefined, undefined, options);
  parse5(code, undefined, undefined, options);
  global.gc();
  suite.add('current', () => {
    parse(code, undefined, undefined, undefined, options);
  });
  suite.add('v6.0.0-alpha.3', () => {
    parse6old(code, undefined, undefined, options);
  });
  suite.add('v5.4.3', () => {
    parse5(code, undefined, undefined, options);
  });
  const result = [suite.name];
  suite.on('cycle', function (event) {
    {
      // separate scope so we can cleanup all this afterwards
      const bench = event.target;
      const factor = bench.hz < 100 ? 100 : 1;
      const msg = `${Math.round(bench.hz * factor) / factor} ops/sec ±${
        Math.round(bench.stats.rme * 100) / 100
      }% (${Math.round(bench.stats.mean * 1000)}ms)`;
      result.push(msg);
    }
    global.gc();
  });
  suite.on('complete', function () {
    process.stdout.write(
      '-> Winner: ' + this.filter('fastest').map('name') + '\n',
    );
  });

  process.stdout.write(`Running benchmark for ${suite.name} ... `);
  global.gc();
  suite.run({ async: false });
  global.gc(); // gc is disabled so ensure we run it
  table.push(result);
});
global.gc(); // gc is disabled so ensure we run it
console.log(table.toString());
