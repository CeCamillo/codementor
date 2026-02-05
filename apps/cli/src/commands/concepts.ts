import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type {
  UserConceptsResponse,
  UserConceptItem,
  ConceptsDueResponse,
} from '@codementor/shared';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function formatMasteryBar(mastery: number, width: number = 20): string {
  const filled = Math.round((mastery / 100) * width);
  const empty = width - filled;

  // Color based on mastery level
  let color: string;
  if (mastery >= 80) {
    color = colors.green;
  } else if (mastery >= 50) {
    color = colors.yellow;
  } else if (mastery >= 25) {
    color = colors.blue;
  } else {
    color = colors.red;
  }

  return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
}

function formatMasteryLevel(mastery: number): string {
  if (mastery >= 80) return `${colors.green}Mastered${colors.reset}`;
  if (mastery >= 50) return `${colors.yellow}Proficient${colors.reset}`;
  if (mastery >= 25) return `${colors.blue}Familiar${colors.reset}`;
  return `${colors.red}Novice${colors.reset}`;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatTimeUntilDue(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${colors.red}${Math.abs(diffDays)}d overdue${colors.reset}`;
  if (diffDays === 0) return `${colors.yellow}Due today${colors.reset}`;
  if (diffDays === 1) return `${colors.green}Due tomorrow${colors.reset}`;
  return `${colors.dim}Due in ${diffDays}d${colors.reset}`;
}

function groupByCategory(concepts: UserConceptItem[]): Map<string, UserConceptItem[]> {
  const groups = new Map<string, UserConceptItem[]>();
  for (const concept of concepts) {
    const existing = groups.get(concept.category) ?? [];
    existing.push(concept);
    groups.set(concept.category, existing);
  }
  return groups;
}

function printSummary(summary: UserConceptsResponse['summary']): void {
  console.log();
  console.log(`${colors.bold}═══ Concept Mastery Summary ═══${colors.reset}`);
  console.log();

  // Stats row
  console.log(
    `  ${colors.green}✓${colors.reset} Mastered: ${colors.bold}${summary.mastered}${colors.reset}`
  );
  console.log(
    `  ${colors.yellow}○${colors.reset} In Progress: ${colors.bold}${summary.inProgress}${colors.reset}`
  );
  console.log(
    `  ${colors.dim}○${colors.reset} Not Started: ${colors.bold}${summary.notStarted}${colors.reset}`
  );
  console.log();

  // Alerts
  if (summary.dueForReview > 0) {
    console.log(
      `  ${colors.yellow}⚠${colors.reset}  ${colors.bold}${summary.dueForReview}${colors.reset} concepts due for review`
    );
  }
  if (summary.struggling > 0) {
    console.log(
      `  ${colors.red}!${colors.reset}  ${colors.bold}${summary.struggling}${colors.reset} concepts need extra practice`
    );
  }
  console.log();
}

function printConceptList(concepts: UserConceptItem[], showAll: boolean = false): void {
  if (concepts.length === 0) {
    console.log(
      `${colors.dim}  No concepts tracked yet. Start a project to begin learning!${colors.reset}`
    );
    console.log();
    return;
  }

  const grouped = groupByCategory(concepts);

  for (const [category, categoryConepts] of grouped) {
    console.log(`${colors.bold}${category}${colors.reset}`);

    // Sort by mastery level (highest first)
    const sorted = [...categoryConepts].sort((a, b) => b.masteryLevel - a.masteryLevel);

    // Limit display unless showAll
    const toShow = showAll ? sorted : sorted.slice(0, 5);

    for (const concept of toShow) {
      const masteryBar = formatMasteryBar(concept.masteryLevel);
      const masteryPct = concept.masteryLevel.toString().padStart(3);

      let statusIndicator = '';
      if (concept.isStruggling) {
        statusIndicator = ` ${colors.red}[needs help]${colors.reset}`;
      } else if (concept.isDueForReview) {
        statusIndicator = ` ${colors.yellow}[review]${colors.reset}`;
      }

      console.log(`  ${concept.name.padEnd(30)} ${masteryBar} ${masteryPct}%${statusIndicator}`);
    }

    if (!showAll && sorted.length > 5) {
      console.log(`  ${colors.dim}... and ${sorted.length - 5} more${colors.reset}`);
    }
    console.log();
  }
}

function printDueConcepts(concepts: UserConceptItem[]): void {
  console.log();
  console.log(`${colors.bold}═══ Concepts Due for Review ═══${colors.reset}`);
  console.log();

  if (concepts.length === 0) {
    console.log(`${colors.green}  ✓ All caught up! No concepts due for review.${colors.reset}`);
    console.log();
    return;
  }

  for (const concept of concepts) {
    const masteryBar = formatMasteryBar(concept.masteryLevel);
    const masteryLevel = formatMasteryLevel(concept.masteryLevel);
    const timeUntilDue = formatTimeUntilDue(concept.nextReviewAt);

    let statusBadge = '';
    if (concept.isStruggling) {
      statusBadge = ` ${colors.red}⚠ Struggling${colors.reset}`;
    }

    console.log(`  ${colors.bold}${concept.name}${colors.reset}${statusBadge}`);
    console.log(`    ${masteryBar} ${concept.masteryLevel}% - ${masteryLevel}`);
    console.log(
      `    ${timeUntilDue} • Practiced ${concept.practiceCount}x • Last: ${formatRelativeTime(concept.lastPracticedAt)}`
    );
    console.log();
  }

  console.log(
    `${colors.dim}Tip: These concepts will be incorporated into your next tasks.${colors.reset}`
  );
  console.log();
}

interface ConceptsOptions {
  due?: boolean;
  all?: boolean;
}

export async function concepts(options: ConceptsOptions = {}): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      `${colors.red}Error:${colors.reset} Not authenticated. Run ${colors.yellow}codementor login${colors.reset} first.`
    );
    process.exit(1);
  }

  try {
    if (options.due) {
      // Show only concepts due for review
      const response = await api.get<ConceptsDueResponse>('/api/users/me/concepts/due');
      printDueConcepts(response.concepts);
    } else {
      // Show all concepts
      const response = await api.get<UserConceptsResponse>('/api/users/me/concepts');
      printSummary(response.summary);
      printConceptList(response.concepts, options.all);

      if (!options.all && response.summary.dueForReview > 0) {
        console.log(
          `${colors.dim}Run ${colors.reset}codementor concepts --due${colors.dim} to see concepts needing review.${colors.reset}`
        );
        console.log();
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    } else {
      console.error(`${colors.red}Error:${colors.reset} Failed to fetch concepts.`);
    }
    process.exit(1);
  }
}
