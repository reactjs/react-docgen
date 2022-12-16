import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Table from 'cli-table';
import glob from 'fast-glob';
import Benchmark from 'benchmark';
import { parse } from '../packages/react-docgen/dist/main.js';
import { parse as parse5 } from 'react-docgen5';
import { parse as parse6 } from 'react-docgen6latest';

console.log(`Node: ${process.version}`);

const __dirname = dirname(fileURLToPath(import.meta.url));

const head = ['fixture', 'v5.4.3', 'v6.0.0-alpha.4', 'current'];

process.stdout.write(`Preparing suites ... `);

const suites = [
  {
    name: 'react-bootstrap',
    files: await glob('./suites/react-bootstrap/src/*.tsx', {
      absolute: false,
      cwd: __dirname,
    }),
  },
];

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

const preparedSuites = [];

suites.forEach(({ name, files }) => {
  const suite = new Benchmark.Suite(name);

  files.forEach(file => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    const options = { filename: file, babelrc: false, configFile: false };
    const newOptions = { babelOptions: options };

    try {
      // warmup
      parse(code, newOptions);
      parse6(code, newOptions);
      parse5(code, undefined, undefined, options);
      global.gc();

      preparedSuites.push({
        code,
        options,
        newOptions,
      });
    } catch {
      // ignore errors
    }
  });

  suite.add('v5.4.3', () => {
    for (const { code, options } of preparedSuites) {
      parse5(code, undefined, undefined, options);
    }
  });
  suite.add('v6.0.0-alpha.4', () => {
    for (const { code, newOptions } of preparedSuites) {
      parse6(code, newOptions);
    }
  });
  suite.add('current', () => {
    for (const { code, newOptions } of preparedSuites) {
      parse(code, newOptions);
    }
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

  process.stdout.write(`Done\nRunning benchmark for ${suite.name} ... `);
  global.gc();
  suite.run({ async: false });
  global.gc(); // gc is disabled so ensure we run it
  table.push(result);
});

global.gc(); // gc is disabled so ensure we run it
console.log(table.toString());
