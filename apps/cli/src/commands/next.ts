import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type {
  CurrentTaskResponse,
  AllTasksCompletedResponse,
  CurrentTaskApiResponse,
} from '@codementor/shared';
import { log, note } from '@clack/prompts';
import { theme, requireAuth, handleCommandError, withSpinner } from '../ui';

function isCompletedResponse(
  response: CurrentTaskApiResponse
): response is AllTasksCompletedResponse {
  return 'completed' in response && response.completed === true;
}

function printCurrentTask(response: CurrentTaskResponse): void {
  const { project, task, progress } = response;

  console.log();
  console.log(`${theme.bold(project.title)} ${theme.muted(`(${project.difficulty})`)}`);
  console.log();

  // Task header with progress
  console.log(theme.bold(`Task ${progress.currentTask}/${progress.totalTasks}: ${task.title}`));
  console.log();

  // Concepts
  if (task.concepts.length > 0) {
    const conceptNames = task.concepts.map((c) => c.name).join(', ');
    console.log(`${theme.info('Concepts:')} ${conceptNames}`);
    console.log();
  }

  // Description in a box
  note(task.description, 'Description');

  // Objectives
  console.log(theme.bold('Objectives:'));
  for (const objective of task.objectives) {
    console.log(`  ${theme.muted('\u25cb')} ${objective}`);
  }
  console.log();

  // Hints
  if (task.hints.length > 0) {
    console.log(`${theme.warning('\ud83d\udca1')} ${theme.bold('Hints:')}`);
    for (const hint of task.hints) {
      console.log(`  - ${hint}`);
    }
    console.log();
  }

  // Resources
  if (task.concepts.length > 0) {
    const allResources = task.concepts.flatMap((c) =>
      c.resources.map((r) => ({ ...r, conceptName: c.name }))
    );
    if (allResources.length > 0) {
      console.log(`${theme.bold('\ud83d\udcda Resources:')}`);
      for (const resource of allResources.slice(0, 3)) {
        console.log(`  - ${resource.title}: ${theme.info(resource.url)}`);
      }
      console.log();
    }
  }

  // Footer
  console.log(
    `${theme.muted('Run')} ${theme.command('codementor submit')} ${theme.muted('when ready for review.')}`
  );
}

function printCompletedMessage(response: AllTasksCompletedResponse): void {
  const { project, progress } = response;

  log.success(
    `Congratulations! You've completed all ${progress.totalTasks} tasks in ${theme.bold(project.title)}!`
  );
  console.log();
  console.log(
    `${theme.muted('Start a new project with:')} ${theme.command('codementor start "<description>"')}`
  );
}

export async function next(): Promise<void> {
  requireAuth(isAuthenticated());

  try {
    const response = await withSpinner('Fetching current task...', () =>
      api.get<CurrentTaskApiResponse>('/api/tasks/current')
    );

    if (isCompletedResponse(response)) {
      printCompletedMessage(response);
    } else {
      printCurrentTask(response);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('No active project')) {
      log.error('No active project found.');
      console.log();
      console.log('  Start a new project with:');
      console.log(`    ${theme.command('codementor start "<description>"')}`);
      console.log();
      console.log('  Example:');
      console.log(`    ${theme.command('codementor start "Build a todo app with React"')}`);
      process.exit(1);
    }

    handleCommandError(error, 'Failed to fetch current task.');
  }
}
