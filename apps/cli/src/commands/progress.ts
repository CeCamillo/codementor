import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { ProgressApiResponse } from '@codementor/shared';
import { isNoActiveProjectResponse } from '@codementor/shared';

function formatProgressBar(completed: number, total: number, width: number = 12): string {
  const percentage = total > 0 ? completed / total : 0;
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function printProgress(response: ProgressApiResponse): void {
  if (isNoActiveProjectResponse(response)) {
    console.log();
    console.log('\x1b[33mNo active project\x1b[0m');
    console.log();
    console.log(response.message);
    console.log();
    return;
  }

  const { project, tasks, currentTask, concepts, time, streak } = response;

  console.log();
  console.log(`\x1b[1m${project.title}\x1b[0m \x1b[90m(${project.difficulty})\x1b[0m`);
  console.log();

  // Progress section
  console.log('\x1b[1mProgress\x1b[0m');
  const percentage = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;
  const progressBar = formatProgressBar(tasks.completed, tasks.total);
  console.log(`  Tasks: [${progressBar}] ${tasks.completed}/${tasks.total} (${percentage}%)`);

  if (currentTask) {
    console.log(`  Current: Task ${currentTask.order} - ${currentTask.title}`);
  }
  console.log();

  // Concepts section
  console.log('\x1b[1mConcepts Learned\x1b[0m');
  console.log(`  \x1b[32m\u2713\x1b[0m Mastered: ${concepts.mastered}`);
  console.log(`  \x1b[90m\u25cb\x1b[0m In Progress: ${concepts.inProgress}`);

  if (concepts.recent.length > 0) {
    console.log('  Recent:');
    for (const concept of concepts.recent) {
      console.log(`    - ${concept.name} (${concept.masteryLevel}%)`);
    }
  }
  console.log();

  // Time & Streak section
  console.log('\x1b[1mTime & Streak\x1b[0m');
  console.log(`  Time invested: ${formatTime(time.investedMinutes)}`);

  const streakText = streak.activeToday
    ? `${streak.currentDays} days (active today)`
    : `${streak.currentDays} days`;
  console.log(`  Current streak: ${streakText}`);
  console.log();

  // Footer
  console.log('\x1b[90mRun\x1b[0m codementor next \x1b[90mto see your current task.\x1b[0m');
}

export async function progress(): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  try {
    const response = await api.get<ProgressApiResponse>('/api/progress');
    printProgress(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to fetch progress.');
    }
    process.exit(1);
  }
}
