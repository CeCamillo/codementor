#!/usr/bin/env bun
import { Command } from 'commander';
import { login, logout, whoami } from './auth';
import { start } from './commands/start';
import { next } from './commands/next';
import { submit } from './commands/submit';
import { progress } from './commands/progress';
import { listProjects, switchProject } from './commands/projects';
import { concepts } from './commands/concepts';
import { showBanner } from './ui';

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
  .action(async () => {
    await progress();
  });

program
  .command('concepts')
  .description('View concept mastery and learning progress')
  .option('--due', 'Show only concepts due for review')
  .option('--all', 'Show all concepts without truncation')
  .action(async (options: { due?: boolean; all?: boolean }) => {
    await concepts(options);
  });

const projectsCommand = program.command('projects').description('Manage projects');

projectsCommand
  .command('list')
  .description('List all projects')
  .action(async () => {
    await listProjects();
  });

projectsCommand
  .command('switch')
  .description('Switch to a different project')
  .argument('[id]', 'Project ID (interactive selector if omitted)')
  .action(async (id?: string) => {
    await switchProject(id);
  });

// Default action for 'projects' without subcommand
projectsCommand.action(async () => {
  await listProjects();
});

// Show banner when no command provided, then exit
if (process.argv.length <= 2) {
  showBanner();
  process.exit(0);
}

program.parse();
