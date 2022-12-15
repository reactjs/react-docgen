import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Table from 'cli-table';
import Benchmark from 'benchmark';
import { parse } from '../packages/react-docgen/dist/main.js';
import { parse as parse4 } from 'react-docgen4';
import { parse as parse5 } from 'react-docgen5';
import { parse as parse6old } from 'react-docgen6pre';

console.log(`Node: ${process.version}`);

const __dirname = dirname(fileURLToPath(import.meta.url));

const head = ['fixture', 'v4.1.1', 'v5.4.3', 'v6.0.0-alpha.3', 'current'];

const files = ['./__fixtures__/CircularProgress.js'];

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
  const suite = new Benchmark.Suite(file.replace(/\.\/__fixtures__\//, ''));
  const options = { filename: file, babelrc: false, configFile: false };
  const newOptions = { babelOptions: options };

  // warmup
  parse(code, newOptions);
  parse6old(code, undefined, undefined, options);
  parse5(code, undefined, undefined, options);
  parse4(code, undefined, undefined, options);
  global.gc();
  suite.add('v4.1.1', () => {
    parse4(code, undefined, undefined, options);
  });
  suite.add('v5.4.3', () => {
    parse5(code, undefined, undefined, options);
  });
  suite.add('v6.0.0-alpha.3', () => {
    parse6old(code, undefined, undefined, options);
  });
  suite.add('current', () => {
    parse(code, newOptions);
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
