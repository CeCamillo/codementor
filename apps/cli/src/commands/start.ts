import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { CreateProjectResponse } from '@codementor/shared';

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours}h ${remainingMins}m`;
}

function printProjectSummary(response: CreateProjectResponse): void {
  const { project, tasks, firstTask } = response;

  console.log();
  console.log(`\x1b[1mProject: ${project.title}\x1b[0m`);
  console.log(
    `${tasks.length} tasks | ~${formatMinutes(project.totalEstimatedMinutes)} estimated | ${project.difficulty}`
  );
  console.log();

  console.log('\x1b[1mTasks:\x1b[0m');
  for (const task of tasks) {
    const status =
      task.status === 'available' ? '\x1b[33m[current]\x1b[0m' : '\x1b[90m[locked]\x1b[0m';
    console.log(`  ${task.order}. ${task.title} ${status}`);
  }
  console.log();

  console.log(`\x1b[1mTask 1/${tasks.length}: ${firstTask.title}\x1b[0m`);
  console.log(firstTask.description);
  console.log();

  console.log('\x1b[1mObjectives:\x1b[0m');
  for (const objective of firstTask.objectives) {
    console.log(`  - ${objective}`);
  }
  console.log();

  if (firstTask.concepts.length > 0) {
    console.log("\x1b[1mYou'll learn:\x1b[0m");
    for (const concept of firstTask.concepts) {
      console.log(`  - ${concept.name}`);
      for (const resource of concept.resources.slice(0, 1)) {
        console.log(`    \x1b[36m${resource.url}\x1b[0m`);
      }
    }
  }
}

export async function start(description: string): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  if (description.length < 10) {
    console.error('\x1b[31mError:\x1b[0m Description too short.');
    console.error();
    console.error('Usage: codementor start "<description>"');
    console.error('Example: codementor start "Build a todo app with vanilla JavaScript"');
    process.exit(1);
  }

  console.log('\x1b[90mGenerating your learning project...\x1b[0m');

  try {
    const response = await api.post<CreateProjectResponse>('/api/projects', {
      description,
    });

    printProjectSummary(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to create project.');
    }
    process.exit(1);
  }
}
