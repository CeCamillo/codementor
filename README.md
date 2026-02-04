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

# Start PostgreSQL (with Docker)
docker run -d --name codementor-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=codementor postgres:16

# Push database schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codementor" \
  bun run --filter=@codementor/db db:push

# Start the API
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/codementor" \
  bun run --filter=@codementor/api dev

# In another terminal, authenticate with the CLI
bun run --filter=@codementor/cli dev -- login
```

## CLI Commands

```bash
# Authenticate with CodeMentor (opens browser)
codementor login

# Show current user
codementor whoami

# Sign out
codementor logout

# Start a learning project
codementor start [project]

# View current task
codementor task

# Get a hint
codementor hint

# Submit code for review
codementor submit

# View progress
codementor progress
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

## Environment Variables

| Variable               | Description                   | Default                                  |
| ---------------------- | ----------------------------- | ---------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string  | `postgresql://localhost:5432/codementor` |
| `CODEMENTOR_API_URL`   | API URL for CLI               | `http://localhost:3000`                  |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID        | -                                        |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret    | -                                        |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID        | -                                        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret    | -                                        |
| `BETTER_AUTH_SECRET`   | Secret for auth token signing | Auto-generated                           |

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codementor
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- PostgreSQL 16+ (or Docker)
- Docker (optional, for local PostgreSQL)

### Commands

| Command                                   | Description               |
| ----------------------------------------- | ------------------------- |
| `bun install`                             | Install dependencies      |
| `bun run build`                           | Build all packages        |
| `bun run dev`                             | Start development servers |
| `bun run typecheck`                       | Run TypeScript checks     |
| `bun run lint`                            | Run ESLint                |
| `bun run test`                            | Run all tests             |
| `bun run format`                          | Format code with Prettier |
| `bun run --filter=@codementor/db db:push` | Push schema to database   |
| `bun run --filter=@codementor/api dev`    | Start API server          |
| `bun run --filter=@codementor/cli dev`    | Run CLI in development    |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
