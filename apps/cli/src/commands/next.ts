import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type {
  CurrentTaskResponse,
  AllTasksCompletedResponse,
  CurrentTaskApiResponse,
} from '@codementor/shared';

function isCompletedResponse(
  response: CurrentTaskApiResponse
): response is AllTasksCompletedResponse {
  return 'completed' in response && response.completed === true;
}

function printCurrentTask(response: CurrentTaskResponse): void {
  const { project, task, progress } = response;

  console.log();
  console.log(`\x1b[1m${project.title}\x1b[0m \x1b[90m(${project.difficulty})\x1b[0m`);
  console.log();

  // Task header with progress
  console.log(`\x1b[1mTask ${progress.currentTask}/${progress.totalTasks}: ${task.title}\x1b[0m`);
  console.log();

  // Concepts
  if (task.concepts.length > 0) {
    const conceptNames = task.concepts.map((c) => c.name).join(', ');
    console.log(`\x1b[36mConcepts:\x1b[0m ${conceptNames}`);
    console.log();
  }

  // Description
  console.log(task.description);
  console.log();

  // Objectives
  console.log('\x1b[1mObjectives:\x1b[0m');
  for (const objective of task.objectives) {
    console.log(`  \x1b[90m○\x1b[0m ${objective}`);
  }
  console.log();

  // Hints
  if (task.hints.length > 0) {
    console.log('\x1b[33m💡 Hints:\x1b[0m');
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
      console.log('\x1b[1m📚 Resources:\x1b[0m');
      for (const resource of allResources.slice(0, 3)) {
        console.log(`  - ${resource.title}: \x1b[36m${resource.url}\x1b[0m`);
      }
      console.log();
    }
  }

  // Footer
  console.log('\x1b[90mRun\x1b[0m codementor submit \x1b[90mwhen ready for review.\x1b[0m');
}

function printCompletedMessage(response: AllTasksCompletedResponse): void {
  const { project, progress } = response;

  console.log();
  console.log(
    `\x1b[32m🎉 Congratulations!\x1b[0m You've completed all ${progress.totalTasks} tasks in \x1b[1m${project.title}\x1b[0m!`
  );
  console.log();
  console.log('\x1b[90mStart a new project with:\x1b[0m codementor start "<description>"');
}

export async function next(): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  try {
    const response = await api.get<CurrentTaskApiResponse>('/api/tasks/current');

    if (isCompletedResponse(response)) {
      printCompletedMessage(response);
    } else {
      printCurrentTask(response);
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('No active project')) {
        console.error('\x1b[31mError:\x1b[0m No active project found.');
        console.error();
        console.error('Start a new project with:');
        console.error('  codementor start "<description>"');
        console.error();
        console.error('Example:');
        console.error('  codementor start "Build a todo app with React"');
        process.exit(1);
      }

      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to fetch current task.');
    }
    process.exit(1);
  }
}
