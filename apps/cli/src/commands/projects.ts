import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { ProjectsListResponse, ProjectSwitchResponse } from '@codementor/shared';

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '\x1b[32m\u2713\x1b[0m'; // green checkmark
    case 'in_progress':
      return '\x1b[33m\u25cb\x1b[0m'; // yellow circle
    case 'not_started':
      return '\x1b[90m\u25cb\x1b[0m'; // gray circle
    case 'abandoned':
      return '\x1b[90m\u2717\x1b[0m'; // gray x
    default:
      return '\x1b[90m-\x1b[0m';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return '\x1b[32mcompleted\x1b[0m';
    case 'in_progress':
      return '\x1b[33min progress\x1b[0m';
    case 'not_started':
      return '\x1b[90mnot started\x1b[0m';
    case 'abandoned':
      return '\x1b[90mabandoned\x1b[0m';
    default:
      return status;
  }
}

export async function listProjects(): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  try {
    const response = await api.get<ProjectsListResponse>('/api/projects/list');

    if (response.projects.length === 0) {
      console.log();
      console.log('\x1b[33mNo projects yet\x1b[0m');
      console.log();
      console.log('Start your first project with:');
      console.log('  codementor start "<description>"');
      console.log();
      console.log('Example:');
      console.log('  codementor start "Build a todo app with React"');
      console.log();
      return;
    }

    console.log();
    console.log('\x1b[1mYour Projects\x1b[0m');
    console.log();

    for (const project of response.projects) {
      const statusIcon = getStatusIcon(project.status);
      const statusLabel = getStatusLabel(project.status);
      const taskProgress = `${project.tasks.completed}/${project.tasks.total} tasks`;

      console.log(`${statusIcon} \x1b[1m${project.title}\x1b[0m`);
      console.log(`  ID: \x1b[36m${project.id}\x1b[0m`);
      console.log(`  Status: ${statusLabel} | ${taskProgress}`);
      console.log(`  Difficulty: ${project.difficulty}`);
      console.log();
    }

    console.log('\x1b[90mSwitch projects with:\x1b[0m codementor projects switch <id>');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to fetch projects.');
    }
    process.exit(1);
  }
}

export async function switchProject(id: string): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  try {
    const response = await api.post<ProjectSwitchResponse>(`/api/projects/${id}/switch`);

    console.log();
    console.log(`\x1b[32mSwitched to:\x1b[0m ${response.project.title}`);
    console.log();

    if (response.currentTask) {
      console.log(
        `Current task: Task ${response.currentTask.order} - ${response.currentTask.title}`
      );
      console.log();
      console.log('\x1b[90mRun\x1b[0m codementor next \x1b[90mto see task details.\x1b[0m');
    } else {
      console.log('No current task available.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to switch project.');
    }
    process.exit(1);
  }
}
