#!/usr/bin/env node
import { program } from 'commander';

program
  .name('react-docgen')
  .executableDir('./commands/')
  .command('debug', 'Print information for debugging')
  .command('parse', 'Extract meta information from React components.', {
    isDefault: true,
    executableFile: 'parse/command.js',
  });

program.parse();
