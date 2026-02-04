import { isAuthenticated } from '../auth';
import { api } from '../utils/api';

interface ProgressResponse {
  user: {
    totalMinutesLearned: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  activeProject: {
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
      description: string;
      status: string;
      order: number;
      conceptIds: string[];
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  masteredConcepts: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    masteryLevel: number;
  }>;
  recentProjects: Array<{
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
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Format minutes as "~X hours" or "X minutes"
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = minutes / 60;
  if (hours < 10) {
    // Show one decimal for smaller numbers
    return `~${hours.toFixed(1)} hours`;
  }
  return `~${Math.round(hours)} hours`;
}

/**
 * Generate ASCII progress bar
 */
function generateProgressBar(percentage: number, width: number = 16): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const filledBar = '█'.repeat(filled);
  const emptyBar = '░'.repeat(empty);
  return `${filledBar}${emptyBar}`;
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
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🔄';
    case 'not_started':
      return '⏳';
    case 'abandoned':
      return '🚫';
    default:
      return '⚪';
  }
}

export async function progress(): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  try {
    const data = await api.get<ProgressResponse>('/api/progress');

    console.log();
    console.log('\x1b[1m📊 Your Progress\x1b[0m');
    console.log();

    // Active Project Section
    if (data.activeProject) {
      const project = data.activeProject;
      const progressBar = generateProgressBar(project.progress.percentage);

      console.log(`\x1b[1m🎯 Current Project:\x1b[0m ${project.title}`);
      console.log(
        `   ${progressBar} ${project.progress.completed}/${project.progress.total} tasks (${project.progress.percentage}%)`
      );
      console.log();

      // Current task info
      if (project.currentTask) {
        console.log(`\x1b[90mCurrent task:\x1b[0m ${project.currentTask.title}`);
        console.log();
      }
    } else {
      console.log('\x1b[90mNo active project.\x1b[0m');
      console.log('Start one with: \x1b[33mcodementor start "<description>"\x1b[0m');
      console.log();
    }

    // Mastered Concepts Section
    if (data.masteredConcepts.length > 0) {
      console.log(`\x1b[1m📚 Concepts Mastered:\x1b[0m ${data.masteredConcepts.length}`);

      // Group by category
      const byCategory = data.masteredConcepts.reduce(
        (acc, concept) => {
          if (!acc[concept.category]) {
            acc[concept.category] = [];
          }
          acc[concept.category]!.push(concept);
          return acc;
        },
        {} as Record<string, typeof data.masteredConcepts>
      );

      for (const [category, concepts] of Object.entries(byCategory)) {
        console.log(`\x1b[90m  ${category}:\x1b[0m`);
        for (const concept of concepts.slice(0, 4)) {
          console.log(`    \x1b[32m✓\x1b[0m ${concept.name}`);
        }
        if (concepts.length > 4) {
          console.log(`    \x1b[90m... and ${concepts.length - 4} more\x1b[0m`);
        }
      }
      console.log();
    }

    // Stats Section
    console.log(`\x1b[1m⏱️  Time Invested:\x1b[0m ${formatTime(data.user.totalMinutesLearned)}`);
    console.log(`\x1b[1m🔥 Current Streak:\x1b[0m ${data.user.currentStreak} days`);

    if (data.user.longestStreak > data.user.currentStreak) {
      console.log(`\x1b[90m   (Longest: ${data.user.longestStreak} days)\x1b[0m`);
    }
    console.log();

    // Recent Projects Section
    if (data.recentProjects.length > 0) {
      console.log('\x1b[1m📁 Recent Projects:\x1b[0m');
      for (const project of data.recentProjects.slice(0, 3)) {
        const emoji = getDifficultyEmoji(project.difficulty);
        const statusEmoji = getStatusEmoji(project.status);
        const progressStr = `${project.progress.completed}/${project.progress.total}`;
        console.log(
          `  ${emoji} ${statusEmoji} \x1b[1m${project.title}\x1b[0m \x1b[90m(${progressStr})\x1b[0m`
        );
      }
      if (data.recentProjects.length > 3) {
        console.log(`  \x1b[90m... and ${data.recentProjects.length - 3} more\x1b[0m`);
      }
      console.log();
    }

    // Call to action
    if (data.activeProject) {
      console.log(
        '\x1b[90mRun\x1b[0m codementor next \x1b[90mto continue your current task.\x1b[0m'
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to fetch progress.');
    }
    process.exit(1);
  }
}
