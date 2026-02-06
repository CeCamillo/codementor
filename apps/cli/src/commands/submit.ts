import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { SubmitResponse } from '@codementor/shared';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { log, note } from '@clack/prompts';
import { theme, requireAuth, handleCommandError, withSpinner, formatMasteryBar } from '../ui';

const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json'];
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
const MAX_FILE_SIZE = 100 * 1024; // 100KB per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total

interface FileInfo {
  path: string;
  content: string;
  size: number;
}

function collectFiles(dir: string, baseDir: string = dir): FileInfo[] {
  const files: FileInfo[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.includes(entry.name)) {
          continue;
        }
        files.push(...collectFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        const hasValidExtension = FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext));
        if (!hasValidExtension) {
          continue;
        }

        const stats = statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          log.warn(`Skipping ${relativePath} (exceeds ${MAX_FILE_SIZE / 1024}KB limit)`);
          continue;
        }

        try {
          const content = readFileSync(fullPath, 'utf-8');
          files.push({
            path: relativePath,
            content,
            size: stats.size,
          });
        } catch {
          log.warn(`Could not read ${relativePath}`);
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

function printMasteryUpdates(
  conceptMastery:
    | Array<{
        conceptId: string;
        conceptName: string;
        newMasteryLevel: number;
        nextReviewAt: string;
        isStruggling: boolean;
      }>
    | undefined
): void {
  if (!conceptMastery || conceptMastery.length === 0) return;

  console.log(theme.bold('Concept Progress:'));
  for (const update of conceptMastery) {
    const masteryBar = formatMasteryBar(update.newMasteryLevel);
    const statusIcon = update.isStruggling ? theme.warning('\u26a0') : theme.success('\u2191');
    console.log(`  ${statusIcon} ${update.conceptName}: ${masteryBar} ${update.newMasteryLevel}%`);
  }
  console.log();
}

function printPassedReview(response: SubmitResponse): void {
  const { review, nextTask, conceptMastery } = response;

  log.success('Task Completed!');
  console.log();

  // Overall feedback
  console.log(`${theme.bold('Overall:')} ${review.overallFeedback}`);
  console.log();

  // Show mastery updates
  printMasteryUpdates(conceptMastery);

  // What you did well (concepts demonstrated)
  const demonstrated = review.conceptsFeedback.filter((cf) => cf.demonstrated);
  if (demonstrated.length > 0) {
    console.log(theme.bold('What you did well:'));
    for (const cf of demonstrated) {
      console.log(`  ${theme.success('\u2713')} ${cf.conceptName}`);
      if (cf.feedback) {
        console.log(`    ${theme.muted(cf.feedback)}`);
      }
    }
    console.log();
  }

  // Praise comments
  const praiseComments = review.codeComments.filter((c) => c.severity === 'praise');
  if (praiseComments.length > 0) {
    console.log(theme.bold('Code highlights:'));
    for (const comment of praiseComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      console.log(
        `  ${theme.filePath(`${comment.filePath}:${lineRange}`)} ${theme.success('[praise]')}`
      );
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  // Reflection questions
  if (review.reflectionQuestions.length > 0) {
    console.log(theme.bold('Reflection:'));
    for (const question of review.reflectionQuestions) {
      console.log(`  ${theme.muted('\u2022')} ${question}`);
    }
    console.log();
  }

  // Next task info
  if (nextTask) {
    console.log(
      `${theme.bold('Next up:')} Task ${nextTask.order}/${nextTask.order} - ${nextTask.title}`
    );
    console.log(
      `${theme.muted('Run')} ${theme.command('codementor next')} ${theme.muted('to see task details.')}`
    );
  } else {
    log.success('Project completed!');
    console.log(
      `${theme.muted('Start a new project with:')} ${theme.command('codementor start "<description>"')}`
    );
  }
}

function printStrugglingAlert(
  strugglingConcepts: Array<{ conceptId: string; conceptName: string; consecutiveFailures: number }>
): void {
  const lines = strugglingConcepts
    .map((c) => `${theme.warning('\u26a0')}  ${c.conceptName} - ${c.consecutiveFailures} attempts`)
    .join('\n');

  note(
    `${lines}\n\n${theme.bold('Suggestions:')}\n1. Take a short break and return with fresh eyes\n2. Try ${theme.command('codementor hint')} for guidance\n3. Review the concept in ${theme.command('codementor concepts')}\n4. Consider breaking the task into smaller pieces`,
    "We noticed you might be stuck - that's completely normal!"
  );
}

function printNeedsWorkReview(response: SubmitResponse): void {
  const { review, strugglingConcepts, conceptMastery } = response;

  // Show struggling alert first if applicable
  if (strugglingConcepts && strugglingConcepts.length > 0) {
    printStrugglingAlert(strugglingConcepts);
  }

  log.warn('Almost there!');
  console.log();

  // Overall feedback
  console.log(`${theme.bold('Overall:')} ${review.overallFeedback}`);
  console.log();

  // Show mastery updates
  printMasteryUpdates(conceptMastery);

  // Code comments (issues and critical first)
  const issueComments = review.codeComments.filter(
    (c) => c.severity === 'critical' || c.severity === 'issue'
  );
  const suggestionComments = review.codeComments.filter((c) => c.severity === 'suggestion');

  if (issueComments.length > 0) {
    console.log(theme.bold('Things to address:'));
    for (const comment of issueComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      const severityColor = comment.severity === 'critical' ? theme.error : theme.warning;
      console.log(
        `  ${theme.filePath(`${comment.filePath}:${lineRange}`)} ${severityColor(`[${comment.severity}]`)}`
      );
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  if (suggestionComments.length > 0) {
    console.log(theme.bold('Suggestions:'));
    for (const comment of suggestionComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      console.log(
        `  ${theme.filePath(`${comment.filePath}:${lineRange}`)} ${theme.blue('[suggestion]')}`
      );
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  // Areas to focus (concepts not demonstrated)
  const notDemonstrated = review.conceptsFeedback.filter((cf) => !cf.demonstrated);
  if (notDemonstrated.length > 0) {
    console.log(theme.bold('Areas to focus:'));
    for (const cf of notDemonstrated) {
      console.log(`  ${theme.warning('\u25cb')} ${cf.conceptName}`);
      if (cf.feedback) {
        console.log(`    ${theme.muted(cf.feedback)}`);
      }
    }
    console.log();
  }

  // Reflection questions
  if (review.reflectionQuestions.length > 0) {
    console.log(theme.bold('Think about:'));
    for (const question of review.reflectionQuestions) {
      console.log(`  ${theme.muted('\u2022')} ${question}`);
    }
    console.log();
  }

  // Suggested resources
  if (review.suggestedResources.length > 0) {
    console.log(theme.bold('Resources:'));
    for (const resource of review.suggestedResources) {
      console.log(`  - ${resource}`);
    }
    console.log();
  }

  console.log(
    `${theme.muted('Run')} ${theme.command('codementor submit')} ${theme.muted('again after making changes.')}`
  );
}

export async function submit(): Promise<void> {
  requireAuth(isAuthenticated());

  // Collect files from current directory
  const cwd = process.cwd();
  const files = collectFiles(cwd);

  if (files.length === 0) {
    log.error('No code files found in current directory.');
    console.log();
    console.log('  Looking for files with these extensions:');
    console.log(`    ${FILE_EXTENSIONS.join(', ')}`);
    console.log();
    console.log('  Make sure you are in the project directory with your code files.');
    process.exit(1);
  }

  // Check total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    log.error(
      `Total file size (${(totalSize / 1024).toFixed(1)}KB) exceeds ${MAX_TOTAL_SIZE / 1024}KB limit.`
    );
    console.log('  Try removing unnecessary files or splitting your project.');
    process.exit(1);
  }

  log.info(`Found ${files.length} file(s): ${theme.muted(files.map((f) => f.path).join(', '))}`);

  try {
    const response = await withSpinner('Submitting for review...', () =>
      api.post<SubmitResponse>('/api/submissions', {
        files: files.map((f) => ({ path: f.path, content: f.content })),
      })
    );

    if (response.review.passed) {
      printPassedReview(response);
    } else {
      printNeedsWorkReview(response);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('No active project')) {
        log.error('No active project found.');
        console.log();
        console.log('  Start a new project with:');
        console.log(`    ${theme.command('codementor start "<description>"')}`);
        process.exit(1);
      }

      if (error.message.includes('No files provided')) {
        log.error('No code files found in current directory.');
        process.exit(1);
      }

      if (error.message.includes('already completed')) {
        log.error('Project already completed!');
        console.log();
        console.log('  Start a new project with:');
        console.log(`    ${theme.command('codementor start "<description>"')}`);
        process.exit(1);
      }
    }

    handleCommandError(error, 'Failed to submit code for review.');
  }
}
