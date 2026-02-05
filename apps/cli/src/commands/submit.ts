import { isAuthenticated } from '../auth';
import { api } from '../utils/api';
import type { SubmitResponse } from '@codementor/shared';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

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
        // Skip excluded directories
        if (EXCLUDED_DIRS.includes(entry.name)) {
          continue;
        }
        // Recurse into subdirectories
        files.push(...collectFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Check file extension
        const hasValidExtension = FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext));
        if (!hasValidExtension) {
          continue;
        }

        // Check file size
        const stats = statSync(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(
            `\x1b[33mWarning:\x1b[0m Skipping ${relativePath} (exceeds ${MAX_FILE_SIZE / 1024}KB limit)`
          );
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
          // Skip files that can't be read
          console.warn(`\x1b[33mWarning:\x1b[0m Could not read ${relativePath}`);
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

  console.log('\x1b[1mConcept Progress:\x1b[0m');
  for (const update of conceptMastery) {
    const masteryBar = formatMasteryBar(update.newMasteryLevel);
    const statusIcon = update.isStruggling ? '\x1b[33m⚠\x1b[0m' : '\x1b[32m↑\x1b[0m';
    console.log(`  ${statusIcon} ${update.conceptName}: ${masteryBar} ${update.newMasteryLevel}%`);
  }
  console.log();
}

function formatMasteryBar(mastery: number): string {
  const width = 10;
  const filled = Math.round((mastery / 100) * width);
  const empty = width - filled;

  let color: string;
  if (mastery >= 80) {
    color = '\x1b[32m'; // green
  } else if (mastery >= 50) {
    color = '\x1b[33m'; // yellow
  } else if (mastery >= 25) {
    color = '\x1b[34m'; // blue
  } else {
    color = '\x1b[31m'; // red
  }

  return `${color}${'█'.repeat(filled)}\x1b[90m${'░'.repeat(empty)}\x1b[0m`;
}

function printPassedReview(response: SubmitResponse): void {
  const { review, nextTask, conceptMastery } = response;

  console.log();
  console.log('\x1b[32m✓ Task Completed!\x1b[0m');
  console.log();

  // Overall feedback
  console.log('\x1b[1mOverall:\x1b[0m ' + review.overallFeedback);
  console.log();

  // Show mastery updates
  printMasteryUpdates(conceptMastery);

  // What you did well (concepts demonstrated)
  const demonstrated = review.conceptsFeedback.filter((cf) => cf.demonstrated);
  if (demonstrated.length > 0) {
    console.log('\x1b[1mWhat you did well:\x1b[0m');
    for (const cf of demonstrated) {
      console.log(`  \x1b[32m✓\x1b[0m ${cf.conceptName}`);
      if (cf.feedback) {
        console.log(`    \x1b[90m${cf.feedback}\x1b[0m`);
      }
    }
    console.log();
  }

  // Praise comments
  const praiseComments = review.codeComments.filter((c) => c.severity === 'praise');
  if (praiseComments.length > 0) {
    console.log('\x1b[1mCode highlights:\x1b[0m');
    for (const comment of praiseComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      console.log(`  \x1b[36m${comment.filePath}:${lineRange}\x1b[0m \x1b[32m[praise]\x1b[0m`);
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  // Reflection questions
  if (review.reflectionQuestions.length > 0) {
    console.log('\x1b[1mReflection:\x1b[0m');
    for (const question of review.reflectionQuestions) {
      console.log(`  \x1b[90m•\x1b[0m ${question}`);
    }
    console.log();
  }

  // Next task info
  if (nextTask) {
    console.log(
      `\x1b[1mNext up:\x1b[0m Task ${nextTask.order}/${nextTask.order} - ${nextTask.title}`
    );
    console.log('\x1b[90mRun\x1b[0m codementor next \x1b[90mto see task details.\x1b[0m');
  } else {
    console.log('\x1b[32m🎉 Project completed!\x1b[0m');
    console.log('\x1b[90mStart a new project with:\x1b[0m codementor start "<description>"');
  }
}

function printStrugglingAlert(
  strugglingConcepts: Array<{ conceptId: string; conceptName: string; consecutiveFailures: number }>
): void {
  console.log();
  console.log('\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[35m  We noticed you might be stuck on some concepts.\x1b[0m');
  console.log("\x1b[35m  That's completely normal - learning takes time!\x1b[0m");
  console.log('\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log();

  for (const concept of strugglingConcepts) {
    console.log(
      `  \x1b[33m⚠\x1b[0m  ${concept.conceptName} - ${concept.consecutiveFailures} attempts`
    );
  }
  console.log();

  console.log('\x1b[1mSuggestions:\x1b[0m');
  console.log('  1. Take a short break and return with fresh eyes');
  console.log('  2. Try \x1b[33mcodementor hint\x1b[0m for guidance');
  console.log('  3. Review the concept in \x1b[33mcodementor concepts\x1b[0m');
  console.log('  4. Consider breaking the task into smaller pieces');
  console.log();
}

function printNeedsWorkReview(response: SubmitResponse): void {
  const { review, strugglingConcepts, conceptMastery } = response;

  // Show struggling alert first if applicable
  if (strugglingConcepts && strugglingConcepts.length > 0) {
    printStrugglingAlert(strugglingConcepts);
  }

  console.log();
  console.log('\x1b[33m○ Almost there!\x1b[0m');
  console.log();

  // Overall feedback
  console.log('\x1b[1mOverall:\x1b[0m ' + review.overallFeedback);
  console.log();

  // Show mastery updates
  printMasteryUpdates(conceptMastery);

  // Code comments (issues and critical first)
  const issueComments = review.codeComments.filter(
    (c) => c.severity === 'critical' || c.severity === 'issue'
  );
  const suggestionComments = review.codeComments.filter((c) => c.severity === 'suggestion');

  if (issueComments.length > 0) {
    console.log('\x1b[1mThings to address:\x1b[0m');
    for (const comment of issueComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      const severityColor = comment.severity === 'critical' ? '\x1b[31m' : '\x1b[33m';
      console.log(
        `  \x1b[36m${comment.filePath}:${lineRange}\x1b[0m ${severityColor}[${comment.severity}]\x1b[0m`
      );
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  if (suggestionComments.length > 0) {
    console.log('\x1b[1mSuggestions:\x1b[0m');
    for (const comment of suggestionComments) {
      const lineRange =
        comment.lineStart === comment.lineEnd
          ? `${comment.lineStart}`
          : `${comment.lineStart}-${comment.lineEnd}`;
      console.log(`  \x1b[36m${comment.filePath}:${lineRange}\x1b[0m \x1b[34m[suggestion]\x1b[0m`);
      console.log(`  ${comment.message}`);
      console.log();
    }
  }

  // Areas to focus (concepts not demonstrated)
  const notDemonstrated = review.conceptsFeedback.filter((cf) => !cf.demonstrated);
  if (notDemonstrated.length > 0) {
    console.log('\x1b[1mAreas to focus:\x1b[0m');
    for (const cf of notDemonstrated) {
      console.log(`  \x1b[33m○\x1b[0m ${cf.conceptName}`);
      if (cf.feedback) {
        console.log(`    \x1b[90m${cf.feedback}\x1b[0m`);
      }
    }
    console.log();
  }

  // Reflection questions
  if (review.reflectionQuestions.length > 0) {
    console.log('\x1b[1mThink about:\x1b[0m');
    for (const question of review.reflectionQuestions) {
      console.log(`  \x1b[90m•\x1b[0m ${question}`);
    }
    console.log();
  }

  // Suggested resources
  if (review.suggestedResources.length > 0) {
    console.log('\x1b[1mResources:\x1b[0m');
    for (const resource of review.suggestedResources) {
      console.log(`  - ${resource}`);
    }
    console.log();
  }

  console.log('\x1b[90mRun\x1b[0m codementor submit \x1b[90magain after making changes.\x1b[0m');
}

export async function submit(): Promise<void> {
  if (!isAuthenticated()) {
    console.error(
      '\x1b[31mError:\x1b[0m Not authenticated. Run \x1b[33mcodementor login\x1b[0m first.'
    );
    process.exit(1);
  }

  // Collect files from current directory
  const cwd = process.cwd();
  console.log('\x1b[90mScanning for code files...\x1b[0m');

  const files = collectFiles(cwd);

  if (files.length === 0) {
    console.error('\x1b[31mError:\x1b[0m No code files found in current directory.');
    console.error();
    console.error('Looking for files with these extensions:');
    console.error(`  ${FILE_EXTENSIONS.join(', ')}`);
    console.error();
    console.error('Make sure you are in the project directory with your code files.');
    process.exit(1);
  }

  // Check total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    console.error(
      `\x1b[31mError:\x1b[0m Total file size (${(totalSize / 1024).toFixed(1)}KB) exceeds ${MAX_TOTAL_SIZE / 1024}KB limit.`
    );
    console.error('Try removing unnecessary files or splitting your project.');
    process.exit(1);
  }

  console.log(
    `\x1b[90mFound ${files.length} file(s): ${files.map((f) => f.path).join(', ')}\x1b[0m`
  );
  console.log();
  console.log('\x1b[90mSubmitting for review...\x1b[0m');

  try {
    const response = await api.post<SubmitResponse>('/api/submissions', {
      files: files.map((f) => ({ path: f.path, content: f.content })),
    });

    if (response.review.passed) {
      printPassedReview(response);
    } else {
      printNeedsWorkReview(response);
    }
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('No active project')) {
        console.error('\x1b[31mError:\x1b[0m No active project found.');
        console.error();
        console.error('Start a new project with:');
        console.error('  codementor start "<description>"');
        process.exit(1);
      }

      if (error.message.includes('No files provided')) {
        console.error('\x1b[31mError:\x1b[0m No code files found in current directory.');
        process.exit(1);
      }

      if (error.message.includes('already completed')) {
        console.error('\x1b[31mError:\x1b[0m Project already completed!');
        console.error();
        console.error('Start a new project with:');
        console.error('  codementor start "<description>"');
        process.exit(1);
      }

      console.error(`\x1b[31mError:\x1b[0m ${error.message}`);
    } else {
      console.error('\x1b[31mError:\x1b[0m Failed to submit code for review.');
    }
    process.exit(1);
  }
}
