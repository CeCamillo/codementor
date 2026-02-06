import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { ProgressApiResponse } from '@codementor/shared';
import { isNoActiveProjectResponse } from '@codementor/shared';
import { log } from '@clack/prompts';
import {
  theme,
  requireAuth,
  handleCommandError,
  withSpinner,
  formatProgressBar,
  formatMinutes,
} from '../ui';

function printProgress(response: ProgressApiResponse): void {
  if (isNoActiveProjectResponse(response)) {
    log.warn('No active project');
    console.log(`  ${response.message}`);
    console.log();
    return;
  }

  const { project, tasks, currentTask, concepts, time, streak } = response;

  console.log();
  console.log(`${theme.bold(project.title)} ${theme.muted(`(${project.difficulty})`)}`);
  console.log();

  // Progress section
  console.log(theme.bold('Progress'));
  const percentage = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;
  const progressBar = formatProgressBar(tasks.completed, tasks.total);
  console.log(`  Tasks: [${progressBar}] ${tasks.completed}/${tasks.total} (${percentage}%)`);

  if (currentTask) {
    console.log(`  Current: Task ${currentTask.order} - ${currentTask.title}`);
  }
  console.log();

  // Concepts section
  console.log(theme.bold('Concepts Learned'));
  console.log(`  ${theme.success('\u2713')} Mastered: ${concepts.mastered}`);
  console.log(`  ${theme.muted('\u25cb')} In Progress: ${concepts.inProgress}`);

  if (concepts.recent.length > 0) {
    console.log('  Recent:');
    for (const concept of concepts.recent) {
      console.log(`    - ${concept.name} (${concept.masteryLevel}%)`);
    }
  }
  console.log();

  // Time & Streak section
  console.log(theme.bold('Time & Streak'));
  console.log(`  Time invested: ${formatMinutes(time.investedMinutes)}`);

  const streakText = streak.activeToday
    ? `${streak.currentDays} days (active today)`
    : `${streak.currentDays} days`;
  console.log(`  Current streak: ${streakText}`);
  console.log();

  // Footer
  console.log(
    `${theme.muted('Run')} ${theme.command('codementor next')} ${theme.muted('to see your current task.')}`
  );
}

export async function progress(): Promise<void> {
  requireAuth(isAuthenticated());

  try {
    const response = await withSpinner('Fetching progress...', () =>
      api.get<ProgressApiResponse>('/api/progress')
    );
    printProgress(response);
  } catch (error) {
    handleCommandError(error, 'Failed to fetch progress.');
  }
}
