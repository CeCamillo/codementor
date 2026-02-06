import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type {
  UserConceptsResponse,
  UserConceptItem,
  ConceptsDueResponse,
} from '@codementor/shared';
import { log, note } from '@clack/prompts';
import {
  theme,
  requireAuth,
  handleCommandError,
  withSpinner,
  formatMasteryBar,
  formatMasteryLevel,
  formatRelativeTime,
  formatTimeUntilDue,
} from '../ui';

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
  const lines = [
    `${theme.success('\u2713')} Mastered: ${theme.bold(String(summary.mastered))}`,
    `${theme.warning('\u25cb')} In Progress: ${theme.bold(String(summary.inProgress))}`,
    `${theme.muted('\u25cb')} Not Started: ${theme.bold(String(summary.notStarted))}`,
  ];

  if (summary.dueForReview > 0) {
    lines.push(
      `${theme.warning('\u26a0')}  ${theme.bold(String(summary.dueForReview))} concepts due for review`
    );
  }
  if (summary.struggling > 0) {
    lines.push(
      `${theme.error('!')}  ${theme.bold(String(summary.struggling))} concepts need extra practice`
    );
  }

  note(lines.join('\n'), 'Concept Mastery Summary');
}

function printConceptList(concepts: UserConceptItem[], showAll: boolean = false): void {
  if (concepts.length === 0) {
    log.info('No concepts tracked yet. Start a project to begin learning!');
    return;
  }

  const grouped = groupByCategory(concepts);

  for (const [category, categoryConcepts] of grouped) {
    console.log();
    console.log(theme.bold(category));

    const sorted = [...categoryConcepts].sort((a, b) => b.masteryLevel - a.masteryLevel);
    const toShow = showAll ? sorted : sorted.slice(0, 5);

    for (const concept of toShow) {
      const masteryBar = formatMasteryBar(concept.masteryLevel, 20);
      const masteryPct = concept.masteryLevel.toString().padStart(3);

      let statusIndicator = '';
      if (concept.isStruggling) {
        statusIndicator = ` ${theme.error('[needs help]')}`;
      } else if (concept.isDueForReview) {
        statusIndicator = ` ${theme.warning('[review]')}`;
      }

      console.log(`  ${concept.name.padEnd(30)} ${masteryBar} ${masteryPct}%${statusIndicator}`);
    }

    if (!showAll && sorted.length > 5) {
      console.log(`  ${theme.muted(`... and ${sorted.length - 5} more`)}`);
    }
  }
  console.log();
}

function printDueConcepts(concepts: UserConceptItem[]): void {
  if (concepts.length === 0) {
    log.success('All caught up! No concepts due for review.');
    return;
  }

  console.log();
  console.log(theme.bold('\u2550\u2550\u2550 Concepts Due for Review \u2550\u2550\u2550'));
  console.log();

  for (const concept of concepts) {
    const masteryBar = formatMasteryBar(concept.masteryLevel, 20);
    const masteryLevel = formatMasteryLevel(concept.masteryLevel);
    const timeUntilDue = formatTimeUntilDue(concept.nextReviewAt);

    let statusBadge = '';
    if (concept.isStruggling) {
      statusBadge = ` ${theme.error('\u26a0 Struggling')}`;
    }

    console.log(`  ${theme.bold(concept.name)}${statusBadge}`);
    console.log(`    ${masteryBar} ${concept.masteryLevel}% - ${masteryLevel}`);
    console.log(
      `    ${timeUntilDue} \u2022 Practiced ${concept.practiceCount}x \u2022 Last: ${formatRelativeTime(concept.lastPracticedAt)}`
    );
    console.log();
  }

  log.info('These concepts will be incorporated into your next tasks.');
}

interface ConceptsOptions {
  due?: boolean;
  all?: boolean;
}

export async function concepts(options: ConceptsOptions = {}): Promise<void> {
  requireAuth(isAuthenticated());

  try {
    if (options.due) {
      const response = await withSpinner('Fetching concepts due for review...', () =>
        api.get<ConceptsDueResponse>('/api/users/me/concepts/due')
      );
      printDueConcepts(response.concepts);
    } else {
      const response = await withSpinner('Fetching concept mastery...', () =>
        api.get<UserConceptsResponse>('/api/users/me/concepts')
      );
      printSummary(response.summary);
      printConceptList(response.concepts, options.all);

      if (!options.all && response.summary.dueForReview > 0) {
        console.log(
          `${theme.muted('Run')} ${theme.command('codementor concepts --due')} ${theme.muted('to see concepts needing review.')}`
        );
        console.log();
      }
    }
  } catch (error) {
    handleCommandError(error, 'Failed to fetch concepts.');
  }
}
