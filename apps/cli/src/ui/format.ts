import { theme } from './theme';

export function formatMasteryBar(mastery: number, width: number = 10): string {
  const filled = Math.round((mastery / 100) * width);
  const empty = width - filled;
  const color = theme.masteryColor(mastery);
  return `${color('\u2588'.repeat(filled))}${theme.muted('\u2591'.repeat(empty))}`;
}

export function formatProgressBar(completed: number, total: number, width: number = 12): string {
  const percentage = total > 0 ? completed / total : 0;
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function formatRelativeTime(dateStr: string | null): string {
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

export function formatTimeUntilDue(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return theme.error(`${Math.abs(diffDays)}d overdue`);
  if (diffDays === 0) return theme.warning('Due today');
  if (diffDays === 1) return theme.success('Due tomorrow');
  return theme.muted(`Due in ${diffDays}d`);
}

export function formatMasteryLevel(mastery: number): string {
  if (mastery >= 80) return theme.success('Mastered');
  if (mastery >= 50) return theme.warning('Proficient');
  if (mastery >= 25) return theme.blue('Familiar');
  return theme.error('Novice');
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return theme.success('\u2713');
    case 'in_progress':
      return theme.warning('\u25cb');
    case 'not_started':
      return theme.muted('\u25cb');
    case 'abandoned':
      return theme.muted('\u2717');
    default:
      return theme.muted('-');
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return theme.success('completed');
    case 'in_progress':
      return theme.warning('in progress');
    case 'not_started':
      return theme.muted('not started');
    case 'abandoned':
      return theme.muted('abandoned');
    default:
      return status;
  }
}
