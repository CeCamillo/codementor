#!/usr/bin/env bun
import { Command } from 'commander';
import { login, logout, whoami } from './auth';
import { start } from './commands/start';
import { next } from './commands/next';
import { submit } from './commands/submit';

const program = new Command();

program
  .name('codementor')
  .description('AI-powered learning platform for web development')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with CodeMentor')
  .action(async () => {
    await login();
  });

program
  .command('logout')
  .description('Sign out of CodeMentor')
  .action(async () => {
    await logout();
  });

program
  .command('whoami')
  .description('Display current user information')
  .action(async () => {
    await whoami();
  });

program
  .command('start')
  .description('Start a new learning project')
  .argument('<description>', 'Project description (e.g., "Build a todo app with React")')
  .action(async (description: string) => {
    await start(description);
  });

program
  .command('next')
  .alias('task')
  .description('View current task')
  .action(async () => {
    await next();
  });

program
  .command('submit')
  .description('Submit code for review')
  .action(async () => {
    await submit();
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
