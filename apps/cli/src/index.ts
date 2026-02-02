#!/usr/bin/env bun
import { Command } from 'commander';

const program = new Command();

program
  .name('codementor')
  .description('AI-powered learning platform for web development')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with CodeMentor')
  .action(() => {
    console.log('Login command - not yet implemented');
  });

program
  .command('start')
  .description('Start a new learning project')
  .argument('[project]', 'Project name or URL')
  .action((project?: string) => {
    console.log(`Starting project: ${project ?? 'interactive selection'}`);
  });

program
  .command('task')
  .description('View current task')
  .action(() => {
    console.log('Current task - not yet implemented');
  });

program
  .command('submit')
  .description('Submit code for review')
  .action(() => {
    console.log('Submit command - not yet implemented');
  });

program
  .command('hint')
  .description('Get a hint for current task')
  .action(() => {
    console.log('Hint command - not yet implemented');
  });

program
  .command('progress')
  .description('View learning progress')
  .action(() => {
    console.log('Progress command - not yet implemented');
  });

program.parse();
