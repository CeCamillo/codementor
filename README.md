# CodeMentor

AI-powered learning platform for web development with personalized mentorship.

## What is CodeMentor?

CodeMentor teaches web development through project-based learning. An AI mentor:

- Breaks down projects into manageable tasks
- Reviews your code like a senior developer
- Provides hints when you're stuck (without giving answers)
- Tracks your concept mastery over time

## Quick Start

```bash
# Install dependencies
bun install

# Run the CLI in development
bun run dev --filter=@codementor/cli

# Run all type checks
bun run typecheck

# Run all tests
bun run test
```

## Project Structure

```
codementor/
├── apps/
│   ├── cli/        # Command-line interface
│   ├── api/        # Backend API
│   └── web/        # Web dashboard (future)
├── packages/
│   ├── shared/     # Shared types and utilities
│   ├── ai/         # AI prompts and concept trees
│   └── db/         # Database schema and queries
```

## Tech Stack

- **Runtime**: Bun + TypeScript
- **Monorepo**: Turborepo
- **CLI**: Commander.js
- **API**: ElysiaJS
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Claude API

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical decisions.

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- PostgreSQL 15+

### Commands

| Command             | Description               |
| ------------------- | ------------------------- |
| `bun install`       | Install dependencies      |
| `bun run build`     | Build all packages        |
| `bun run dev`       | Start development servers |
| `bun run typecheck` | Run TypeScript checks     |
| `bun run lint`      | Run ESLint                |
| `bun run test`      | Run all tests             |
| `bun run format`    | Format code with Prettier |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
