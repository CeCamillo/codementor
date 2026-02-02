import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type PlaybookName =
  | 'project-breakdown'
  | 'socratic-questioning'
  | 'code-review'
  | 'struggling-user'
  | 'advanced-user';

const playbookCache = new Map<PlaybookName, string>();

export function getPlaybook(name: PlaybookName): string {
  const cached = playbookCache.get(name);
  if (cached) return cached;

  const filePath = join(__dirname, `${name}.md`);
  const content = readFileSync(filePath, 'utf-8');
  playbookCache.set(name, content);
  return content;
}

export function getAllPlaybooks(): Record<PlaybookName, string> {
  const names: PlaybookName[] = [
    'project-breakdown',
    'socratic-questioning',
    'code-review',
    'struggling-user',
    'advanced-user',
  ];

  return Object.fromEntries(names.map((name) => [name, getPlaybook(name)])) as Record<
    PlaybookName,
    string
  >;
}
