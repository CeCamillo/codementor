import { isAuthenticated } from '../auth';
import { api } from '../utils/api';

interface ProjectsListResponse {
  projects: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    status: string;
    progress: {
      completed: number;
      total: number;
      percentage: number;
    };
    currentTask: {
      id: string;
      title: string;
      order: number;
      status: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface SwitchResponse {
  success: boolean;
  message: string;
  projectId: string;
}

/**
 * Get difficulty emoji
 */
function getDifficultyEmoji(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return '🟢';
    case 'intermediate':
      return '🟡';
    case 'advanced':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Get status label with color
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return '\x1b[32mcompleted\x1b[0m';
    case 'in_progress':
      return '\x1b[36min progress\x1b[0m';
    case 'not_started':
      return '\x1b[90mnot started\x1b[0m';
    case 'abandoned':
      return '\x1b[31mabandoned\x1b[0m';
    default:
      return status;
  }
}

/**
 * Generate ASCII progress bar
 */
function generateProgressBar(percentage: number, width: number = 10): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  return `${filledBar}${emptyBar}`;
}

/**
 * Format date as relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
    }
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else {
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}

/**
 * List all projects
 */
async function listProjects(): Promise<void> {
  const data = await api.get<ProjectsListResponse>('/api/projects');

  if (data.projects.length === 0) {
    console.log();
    console.log('\x1b[90mNo projects yet.\x1b[0m');
    console.log('Create one with: \x1b[33mcodementor start "<description>"\x1b[0m');
    console.log();
    return;
  }

  console.log();
  console.log(`\x1b[1m📁 Your Projects (${data.projects.length})\x1b[0m`);
  console.log();

  // Group by status
  const inProgress = data.projects.filter((p) => p.status === 'in_progress');
  const notStarted = data.projects.filter((p) => p.status === 'not_started');
  const completed = data.projects.filter((p) => p.status === 'completed');
  const abandoned = data.projects.filter((p) => p.status === 'abandoned');

  // Display in progress projects first
  if (inProgress.length > 0) {
    console.log('\x1b[1mIn Progress:\x1b[0m');
    for (const project of inProgress) {
      displayProject(project, true);
    }
    console.log();
  }

  // Display not started projects
  if (notStarted.length > 0) {
    console.log('\x1b[1mNot Started:\x1b[0m');
    for (const project of notStarted) {
      displayProject(project, true);
    }
    console.log();
  }

  // Display completed projects
  if (completed.length > 0) {
    console.log('\x1b[1mCompleted:\x1b[0m');
    for (const project of completed) {
      displayProject(project, false);
    }
    console.log();
  }

  // Display abandoned projects (compact)
  if (abandoned.length > 0) {
    console.log('\x1b[1mAbandoned:\x1b[0m');
    for (const project of abandoned) {
      console.log(`  \x1b[31m✗\x1b[0m \x1b[90m${project.title}\x1b[0m`);
    }
    console.log();
  }

  console.log('\x1b[90mSwitch to a project:\x1b[0m codementor projects switch <id>');
  console.log();
}

/**
 * Display a single project
 */
function displayProject(project: ProjectsListResponse['projects'][0], showProgress: boolean): void {
  const emoji = getDifficultyEmoji(project.difficulty);
  const progressBar = generateProgressBar(project.progress.percentage);

  console.log(`  ${emoji} \x1b[1m${project.title}\x1b[0m`);
  console.log(`     \x1b[90mID:\x1b[0m ${project.id}`);

  if (showProgress) {
    console.log(
      `     \x1b[90mProgress:\x1b[0m ${progressBar} ${project.progress.completed}/${project.progress.total} (${project.progress.percentage}%)`
    );
    if (project.currentTask) {
      console.log(`     \x1b[90mCurrent:\x1b[0m ${project.currentTask.title}`);
    }
  }

  console.log(`     \x1b[90mStatus:\x1b[0m ${getStatusLabel(project.status)}`);
  console.log(`     \x1b[90mUpdated:\x1b[0m ${formatRelativeTime(project.updatedAt)}`);
  console.log();
}

/**
 * Switch to a project
 */
async function switchProject(projectId: string): Promise<void> {
  if (!projectId) {
    console.error('\x1b[31mError:\x1b[0m Project ID is required.');
    console.error('Usage: codementor projects switch <id>');
    process.exit(1);
  }

  try {
    const data = await api.post<SwitchResponse>(`/api/projects/${projectId}/switch`, {});

    console.log();
    console.log(`\x1b[32m✓ ${data.message}\x1b[0m`);
    console.log();
    console.log('\x1b[90mRun\x1b[0m codementor next \x1b[90mto see your current task.\x1b[0m');
    console.log();
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('not_found')) {
        console.error(`\x1b[31mError:\x1b[0m Project not found: ${projectId}`);
        console.error(
          '\x1b[90mRun\x1b[0m codementor projects \x1b[90mto see available projects.\x1b[0m'
        );
      } else if (error.message.includes('completed')) {
        console.error(`\x1b[31mError:\x1b[0m Cannot switch to a completed project.`);
      } else if (error.message.includes('abandoned')) {
        console.error(`\x1b[31mError:\x1b[0m Cannot switch to an abandoned project.`);
      } else {
        console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
      }
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to switch project.');
    }
    process.exit(1);
  }
}

/**
 * Main projects command handler
 */
export async function projects(args: string[]): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  const subcommand = args[0];

  try {
    switch (subcommand) {
      case 'switch': {
        const projectId = args[1];
        if (!projectId) {
          console.error('\x1b[31mError:\x1b[0m Project ID is required.');
          console.error('Usage: codementor projects switch <id>');
          process.exit(1);
        }
        await switchProject(projectId);
        break;
      }
      case 'list':
      case undefined:
        await listProjects();
        break;
      default:
        console.error(`\x1b[31mError:\x1b[0m Unknown subcommand: ${subcommand}`);
        console.error();
        console.error('Usage:');
        console.error('  codementor projects           List all projects');
        console.error('  codementor projects list      List all projects');
        console.error('  codementor projects switch <id>  Switch to a project');
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to execute command.');
    }
    process.exit(1);
  }
}
