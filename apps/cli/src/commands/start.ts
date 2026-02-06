import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { CreateProjectResponse } from '@codementor/shared';
import { log, note } from '@clack/prompts';
import { theme, requireAuth, handleCommandError, withSpinner, formatMinutes } from '../ui';

function printProjectSummary(response: CreateProjectResponse): void {
  const { project, tasks, firstTask } = response;

  console.log();
  console.log(`${theme.bold(`Project: ${project.title}`)}`);
  console.log(
    `${tasks.length} tasks | ~${formatMinutes(project.totalEstimatedMinutes)} estimated | ${project.difficulty}`
  );
  console.log();

  console.log(theme.bold('Tasks:'));
  for (const task of tasks) {
    const status =
      task.status === 'available' ? theme.warning('[current]') : theme.muted('[locked]');
    console.log(`  ${task.order}. ${task.title} ${status}`);
  }
  console.log();

  note(firstTask.description, `Task 1/${tasks.length}: ${firstTask.title}`);

  console.log(theme.bold('Objectives:'));
  for (const objective of firstTask.objectives) {
    console.log(`  - ${objective}`);
  }
  console.log();

  if (firstTask.concepts.length > 0) {
    console.log(theme.bold("You'll learn:"));
    for (const concept of firstTask.concepts) {
      console.log(`  - ${concept.name}`);
      for (const resource of concept.resources.slice(0, 1)) {
        console.log(`    ${theme.info(resource.url)}`);
      }
    }
  }
}

export async function start(description: string): Promise<void> {
  requireAuth(isAuthenticated());

  if (description.length < 10) {
    log.error('Description too short.');
    console.log();
    console.log(`  Usage: ${theme.command('codementor start "<description>"')}`);
    console.log(
      `  Example: ${theme.command('codementor start "Build a todo app with vanilla JavaScript"')}`
    );
    process.exit(1);
  }

  try {
    const response = await withSpinner(
      'Generating your learning project...',
      () => api.post<CreateProjectResponse>('/api/projects', { description }),
      'Project generated'
    );

    printProjectSummary(response);
  } catch (error) {
    handleCommandError(error, 'Failed to create project.');
  }
}
