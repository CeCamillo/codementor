import { intro } from '@clack/prompts';
import pc from 'picocolors';

export function showBanner(): void {
  intro(pc.bgCyan(pc.black(' codementor ')));

  console.log();
  console.log(`  ${pc.bold('Commands:')}`);
  console.log(`    ${pc.cyan('login')}             Authenticate with CodeMentor`);
  console.log(`    ${pc.cyan('start')} ${pc.dim('<desc>')}     Start a new learning project`);
  console.log(`    ${pc.cyan('next')}              View current task`);
  console.log(`    ${pc.cyan('submit')}            Submit code for review`);
  console.log(`    ${pc.cyan('progress')}          View learning progress`);
  console.log(`    ${pc.cyan('concepts')}          View concept mastery`);
  console.log(`    ${pc.cyan('projects')}          Manage projects`);
  console.log();
  console.log(`  Run ${pc.bold(pc.yellow('codementor <command> --help'))} for details`);
  console.log();
}
