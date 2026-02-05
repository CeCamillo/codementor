# CodeMentor

AI-powered learning platform for web development with personalized mentorship.

## What is CodeMentor?

CodeMentor teaches web development through project-based learning. An AI mentor:

- Generates personalized projects based on your goals
- Breaks projects into manageable tasks with clear objectives
- Reviews your code like a senior developer (Socratic feedback)
- Provides progressive hints when you're stuck (without giving answers)
- Tracks concept mastery with spaced repetition
- Detects anti-patterns and explains why they matter
- Visualizes your learning progress

## Features

### CLI

| Command                           | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| `codementor login`                | Authenticate via OAuth device flow                    |
| `codementor logout`               | Sign out and clear session                            |
| `codementor whoami`               | Display current user                                  |
| `codementor start <description>`  | Create AI-generated project (`--difficulty` optional) |
| `codementor next` / `task`        | View current task with objectives and resources       |
| `codementor hint`                 | Get progressive hints (4-level escalation)            |
| `codementor submit`               | Submit code for comprehensive AI review               |
| `codementor progress`             | View learning stats and streak                        |
| `codementor concepts`             | View concept mastery (`--due` for review items)       |
| `codementor projects list`        | List all projects                                     |
| `codementor projects switch <id>` | Switch to different project                           |

### Web Dashboard

- **Dashboard**: Stats overview, current project, concepts due for review
- **Projects**: Browse, filter, and manage learning projects
- **Concepts**: Track mastery levels with progress visualization
- **Learning Graph**: Interactive concept map showing prerequisites and progress

### AI-Powered Code Review

When you submit code, the system runs:

1. **AI Code Review**: Socratic feedback on your implementation
2. **Test Execution**: Runs generated tests in a sandboxed environment
3. **Anti-Pattern Detection**: Identifies 14+ code quality issues with explanations
4. **Reasoning Assessment**: Asks "Why did you do X?" to verify understanding
5. **Concept Mastery Updates**: Adjusts mastery via spaced repetition algorithm

### Spaced Repetition

- SM-2 inspired algorithm adapts review intervals based on performance
- Concepts due for review are incorporated into new projects
- Struggling detection triggers when 3+ consecutive failures occur
- Mastery tiers: Novice (0-25) → Familiar (25-50) → Proficient (50-75) → Mastered (75+)

## Quick Start

```bash
# Install dependencies
bun install

# Start PostgreSQL (with Docker)
docker run -d --name codementor-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=codementor postgres:16

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Push database schema
bun run --filter=@codementor/db db:push

# Start all services
bun run dev
```

### Using the CLI

```bash
# Authenticate
bun run --filter=@codementor/cli dev -- login

# Start a project
bun run --filter=@codementor/cli dev -- start "Build a todo app with React"

# View your task
bun run --filter=@codementor/cli dev -- next

# Submit your code
bun run --filter=@codementor/cli dev -- submit
```

## Project Structure

```
codementor/
├── apps/
│   ├── cli/           # Command-line interface
│   ├── api/           # Backend API (ElysiaJS)
│   └── web/           # Web dashboard (Next.js)
├── packages/
│   ├── shared/        # Shared types and utilities
│   ├── ai/            # AI generators and algorithms
│   │   ├── generators/    # Project, review, hint, test generation
│   │   ├── sandbox/       # Code execution (Piston API)
│   │   ├── algorithms/    # Spaced repetition
│   │   ├── concepts/      # Concept definitions
│   │   └── playbooks/     # AI prompt templates
│   └── db/            # Database schema (Drizzle ORM)
```

## Tech Stack

| Component | Technology                      |
| --------- | ------------------------------- |
| Runtime   | Bun + TypeScript                |
| Monorepo  | Turborepo                       |
| CLI       | Commander.js + Ink              |
| API       | ElysiaJS                        |
| Web       | Next.js 15 + Tailwind           |
| Database  | PostgreSQL + Drizzle ORM        |
| AI        | Claude API (Sonnet/Haiku)       |
| Sandbox   | Piston API                      |
| Auth      | Better Auth (OAuth device flow) |

## Environment Variables

| Variable               | Description                    | Required                                  |
| ---------------------- | ------------------------------ | ----------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string   | Yes                                       |
| `ANTHROPIC_API_KEY`    | Claude API key for AI features | Yes                                       |
| `BETTER_AUTH_SECRET`   | Secret for auth token signing  | Yes                                       |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID         | For GitHub login                          |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret     | For GitHub login                          |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID         | For Google login                          |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret     | For Google login                          |
| `CODEMENTOR_API_URL`   | API URL for CLI                | Default: `http://localhost:3000`          |
| `PISTON_API_URL`       | Piston sandbox URL             | Default: `https://emkc.org/api/v2/piston` |

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- PostgreSQL 16+ (or Docker)

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

### Database

```bash
# Generate migration
bun run --filter=@codementor/db db:generate

# Run migrations
bun run --filter=@codementor/db db:migrate

# Push schema directly (dev)
bun run --filter=@codementor/db db:push

# Open Drizzle Studio
bun run --filter=@codementor/db db:studio
```

## API Endpoints

### Authentication

- `POST /auth/device/authorize` - Start device flow
- `GET /auth/device/verify` - Verify device code
- `POST /auth/device/poll` - Poll for authorization

### Projects

- `POST /api/projects` - Create AI-generated project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/switch` - Switch active project
- `DELETE /api/projects/:id` - Archive project

### Tasks

- `GET /api/tasks/current` - Get current task
- `GET /api/tasks/:id/hint` - Get next hint
- `POST /api/tasks/:id/respond` - Submit reflection answers

### Submissions

- `POST /api/submissions` - Submit code for review

### Progress

- `GET /api/progress` - Get learning progress
- `GET /api/users/me/concepts` - Get concept mastery
- `GET /api/users/me/concepts/due` - Get concepts due for review
- `GET /api/users/me/concepts/graph` - Get concept graph data

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical decisions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
