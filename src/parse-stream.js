import { Transform } from 'stream';
import async from 'async';
import dir from 'node-dir';
import fs  from 'fs';
import * as parser from './main';
import path from 'path';

const regexRegex = /^\/(.*)\/([igymu]{0,5})$/;

export default class ParseStream extends Transform {
  _sourceDir: string;
  _paths: Array<string>;
  _resolver: string;
  _outFile: string;
  _extension: string;
  _exclude: string;
  _ignore: string;

  constructor(opts) {
    super({ objectMode: true });

    const {
      extension,
      ignore,
      paths,
      resolver
    } = opts

    // Handle regular expression syntax passed for exclude
    let exclude = opts.exclude;
    if (exclude && exclude.length === 1 && regexRegex.test(exclude[0])) {
      const match = excludePatterns[0].match(regexRegex);
      exclude = new RegExp(match[1], match[2]);
    }

    this._extensions = new RegExp('\\.(?:' + extension.join('|') + ')$');
    this._excludePatterns = exclude;
    this._ignoreDir = ignore;
    this._paths = paths;

    if (resolver) {
      try {
        // Look for built-in resolver
        this._resolver = require(`../dist/resolver/${resolver}`).default;
      } catch(e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e;
        }

        const resolverPath = path.resolve(process.cwd(), resolver);
        try {
          // Look for local resolver
          this._resolver = require(resolverPath);
        } catch (e) {
          if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
          }

          // Will exit with this error message
          throw new Error(
            `Unknown resolver: "${resolver}" is neither a built-in resolver ` +
            `nor can it be found locally ("${resolverPath}")`
          );
        }
      }
    }

    // If a set of file paths are provided then in the next tick begin
    // reading from them and automatically end this instance when
    // complete.
    if (Array.isArray(this._paths) && this._paths.length) {
      setImmediate(() => this.traverse(() => {
        this.end();
      }));
    }
  }

  parse(source) {
    return parser.parse(source, this._resolver);
  }

  traverse(done = function () {}) {
    async.eachSeries(this._paths, (filePath, next) => {
      fs.stat(filePath, (error, stats) => {
        if (error) {
          this.emit('warning', { error, filePath, where: 'stat' });
          return next();
        }

        if (stats.isDirectory()) {
          return this.traverseDir(filePath, (error) => {
            if (error) {
              this.emit('warning', { error, filePath, where: 'traverseDir' });
            }

            next();
          });
        }

        try {
          const ast = this.parse(fs.readFileSync(filePath));
          this.push({ file: filePath, ast });
        } catch(error) {
          this.emit('warning', { error, filePath, where: 'parse' });
        } finally {
          next();
        }
      });
    }, done);
  }

  traverseDir(filePath, done) {
    dir.readFiles(
      filePath,
      {
        match: this._extensions,
        exclude: this._excludePatterns,
        excludeDir: this._ignoreDir,
      },
      (error, content, filename, next) => {
        if (error) {
          return next(error);
        }

        try {
          const ast = this.parse(content);
          this.push({ file: filename, ast });
        } catch(error) {
          this.emit('warning', { error, filePath, where: 'parse' });
        }

        next();
      },
      done
    );
  }
}
