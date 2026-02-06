import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { ProjectsListResponse, ProjectSwitchResponse } from '@codementor/shared';
import { select, isCancel, log } from '@clack/prompts';
import {
  theme,
  requireAuth,
  handleCommandError,
  withSpinner,
  getStatusIcon,
  getStatusLabel,
} from '../ui';

export async function listProjects(): Promise<void> {
  requireAuth(isAuthenticated());

  try {
    const response = await withSpinner('Fetching projects...', () =>
      api.get<ProjectsListResponse>('/api/projects/list')
    );

    if (response.projects.length === 0) {
      log.warn('No projects yet');
      console.log();
      console.log('  Start your first project with:');
      console.log(`    ${theme.command('codementor start "<description>"')}`);
      console.log();
      console.log('  Example:');
      console.log(`    ${theme.command('codementor start "Build a todo app with React"')}`);
      console.log();
      return;
    }

    console.log();
    console.log(theme.bold('Your Projects'));
    console.log();

    for (const project of response.projects) {
      const statusIcon = getStatusIcon(project.status);
      const statusLabel = getStatusLabel(project.status);
      const taskProgress = `${project.tasks.completed}/${project.tasks.total} tasks`;

      console.log(`${statusIcon} ${theme.bold(project.title)}`);
      console.log(`  ID: ${theme.info(project.id)}`);
      console.log(`  Status: ${statusLabel} | ${taskProgress}`);
      console.log(`  Difficulty: ${project.difficulty}`);
      console.log();
    }

    console.log(
      `${theme.muted('Switch projects with:')} ${theme.command('codementor projects switch')}`
    );
  } catch (error) {
    handleCommandError(error, 'Failed to fetch projects.');
  }
}

export async function switchProject(id?: string): Promise<void> {
  requireAuth(isAuthenticated());

  try {
    // If no ID provided, show interactive selector
    if (!id) {
      const response = await withSpinner('Fetching projects...', () =>
        api.get<ProjectsListResponse>('/api/projects/list')
      );

      if (response.projects.length === 0) {
        log.warn('No projects to switch to. Create one first.');
        return;
      }

      const selected = await select({
        message: 'Select a project:',
        options: response.projects.map((p) => ({
          value: p.id,
          label: `${getStatusIcon(p.status)} ${p.title}`,
          hint: `${p.tasks.completed}/${p.tasks.total} tasks \u2022 ${p.difficulty}`,
        })),
      });

      if (isCancel(selected)) {
        log.warn('Cancelled.');
        return;
      }

      id = selected as string;
    }

    const response = await withSpinner('Switching project...', () =>
      api.post<ProjectSwitchResponse>(`/api/projects/${id}/switch`)
    );

    log.success(`Switched to: ${response.project.title}`);

    if (response.currentTask) {
      console.log(
        `  Current task: Task ${response.currentTask.order} - ${response.currentTask.title}`
      );
      console.log();
      console.log(
        `${theme.muted('Run')} ${theme.command('codementor next')} ${theme.muted('to see task details.')}`
      );
    } else {
      console.log('  No current task available.');
    }
  } catch (error) {
    handleCommandError(error, 'Failed to switch project.');
  }
}
