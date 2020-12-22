const fs = require('fs');
const path = require('path');
const Table = require('cli-table');
const Benchmark = require('benchmark');
const { parse } = require('..');

console.log(`Node: ${process.version}`);

const head = ['fixture', 'timing'];

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
  parse(code, null, null, options);
  global.gc();
  suite.add(0, () => {
    parse(code, null, null, options);
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

  console.log(`Running benchmark for ${suite.name} ...`);
  global.gc();
  suite.run({ async: false });
  global.gc(); // gc is disabled so ensure we run it
  table.push(result);
});
global.gc(); // gc is disabled so ensure we run it
console.log(table.toString());
