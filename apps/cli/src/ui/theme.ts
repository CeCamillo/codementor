import pc from 'picocolors';

export const theme = {
  // Semantic colors
  success: pc.green,
  error: pc.red,
  warning: pc.yellow,
  info: pc.cyan,
  muted: pc.dim,
  bold: pc.bold,
  highlight: pc.magenta,
  blue: pc.blue,

  // Domain-specific
  command: (s: string) => pc.bold(pc.yellow(s)),
  url: pc.cyan,
  label: pc.bold,
  filePath: pc.cyan,

  // Mastery color by level
  masteryColor(level: number): (s: string) => string {
    if (level >= 80) return pc.green;
    if (level >= 50) return pc.yellow;
    if (level >= 25) return pc.blue;
    return pc.red;
  },
} as const;
