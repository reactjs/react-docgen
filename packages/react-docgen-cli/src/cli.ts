#!/usr/bin/env node
import { Command } from 'commander';
import createParseCommand from './commands/parse/command.js';

const program = new Command()
  .name('react-docgen')
  .helpOption(false)
  .addCommand(createParseCommand(), {
    isDefault: true,
  });

await program.parseAsync();
