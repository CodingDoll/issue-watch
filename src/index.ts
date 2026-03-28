#!/usr/bin/env node
import { Command } from 'commander';
import { createListCommand } from './commands/list.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const program = new Command();

program
  .name('issuewatch')
  .description('A CLI tool for viewing GitHub issues')
  .version(packageJson.version)
  .option('-t, --token <token>', 'GitHub personal access token');

program.addCommand(createListCommand());

program.parse();
