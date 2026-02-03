# CodeMentor Architecture

## Overview

CodeMentor is an AI-powered learning platform that teaches web development through project-based learning with personalized mentorship. This document outlines our technology choices and architectural decisions.

## Tech Stack

### Runtime & Language

| Technology     | Purpose            | Rationale                                                     |
| -------------- | ------------------ | ------------------------------------------------------------- |
| **Bun**        | JavaScript runtime | Fast startup, native TypeScript support, built-in test runner |
| **TypeScript** | Language           | End-to-end type safety, better DX, reduced runtime errors     |

### Monorepo

| Technology    | Purpose      | Rationale                                              |
| ------------- | ------------ | ------------------------------------------------------ |
| **Turborepo** | Build system | Fast caching, parallel execution, simple configuration |

### CLI Application

| Technology       | Purpose       | Rationale                                       |
| ---------------- | ------------- | ----------------------------------------------- |
| **Commander.js** | CLI framework | Mature, well-documented, extensive ecosystem    |
| **Ink**          | Terminal UI   | React-based, composable components for rich TUI |

### Backend API

| Technology     | Purpose        | Rationale                                           |
| -------------- | -------------- | --------------------------------------------------- |
| **ElysiaJS**   | Web framework  | Bun-native, TypeScript-first, excellent performance |
| **BetterAuth** | Authentication | Modern, flexible, supports multiple providers       |

### Database

| Technology      | Purpose          | Rationale                                            |
| --------------- | ---------------- | ---------------------------------------------------- |
| **PostgreSQL**  | Primary database | Robust, JSONB support, excellent for relational data |
| **Drizzle ORM** | Database toolkit | Type-safe queries, lightweight, great migrations     |

### AI Integration

| Technology                   | Purpose      | Rationale                                                |
| ---------------------------- | ------------ | -------------------------------------------------------- |
| **Claude API**               | AI provider  | Superior reasoning, code understanding, teaching ability |
| **claude-sonnet-4-20250514** | Code reviews | Deep analysis, nuanced feedback                          |
| **claude-haiku**             | Quick tasks  | Fast responses, cost-efficient for simple operations     |

### Hosting & Infrastructure

| Service                  | Purpose       | Rationale                                           |
| ------------------------ | ------------- | --------------------------------------------------- |
| **Railway** / **Render** | API hosting   | Easy deployment, PostgreSQL support, good free tier |
| **Vercel**               | Web dashboard | Excellent Next.js support, edge functions           |
| **GitHub Actions**       | CI/CD         | Native integration, generous free tier              |

## Project Structure

```
codementor/
├── apps/
│   ├── cli/                 # CLI application (Commander.js + Ink)
│   ├── api/                 # Backend API (ElysiaJS)
│   └── web/                 # Web dashboard (Next.js) - future
├── packages/
│   ├── shared/              # Shared types, utilities, constants
│   ├── ai/                  # AI prompts, playbooks, concept trees
│   └── db/                  # Drizzle schema, migrations, queries
├── turbo.json               # Turborepo configuration
├── package.json             # Root package.json
└── tsconfig.base.json       # Shared TypeScript config
```

## Design Principles

### 1. End-to-End Type Safety

- Drizzle provides typed database queries
- ElysiaJS provides typed API routes
- Shared types package ensures consistency across apps
- No `any` types allowed

### 2. Error Observability

- Structured logging with context
- Error boundaries with meaningful messages
- AI interaction logging for debugging prompts
- Metrics for response times and token usage

### 3. Testability

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Bun's built-in test runner for speed

### 4. Developer Experience

- Hot reload in development
- Type checking on commit (Husky)
- Consistent code style (ESLint + Prettier)
- Clear error messages

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    CLI      │────▶│    API      │────▶│  Database   │
│ (Commander) │     │ (ElysiaJS)  │     │ (PostgreSQL)│
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Claude AI  │
                   │   (Sonnet)  │
                   └─────────────┘
```

1. User interacts via CLI
2. CLI sends requests to API
3. API processes business logic
4. API calls Claude for AI features (reviews, hints, project breakdown)
5. API persists data to PostgreSQL
6. Response flows back to CLI

## Authentication Flow

1. User runs `codementor login`
2. CLI opens browser for OAuth (GitHub/Google via BetterAuth)
3. Callback saves token locally (`~/.codementor/config.json`)
4. Subsequent requests include token in Authorization header
5. API validates token via BetterAuth middleware

## AI Integration Patterns

### Model Selection

- **Sonnet**: Code reviews, project breakdowns, complex explanations
- **Haiku**: Quick hints, simple validations, status checks

### Prompt Management

All prompts are stored in `packages/ai/playbooks/` as versioned markdown files:

- Enables prompt iteration without code changes
- Supports A/B testing of different approaches
- Provides audit trail for prompt evolution

### Cost Control

- Token budgets per request type
- Caching for repeated queries
- Streaming for long responses
- Haiku for high-frequency, low-complexity tasks

## Security Considerations

- API keys stored in environment variables, never committed
- User tokens encrypted at rest
- Rate limiting on AI endpoints
- Input sanitization before AI prompts
- No PII in AI prompts beyond necessary context

## Future Considerations

- **Web Dashboard**: Next.js app for progress visualization
- **VS Code Extension**: IDE integration for seamless workflow
- **Team Features**: Mentorship matching, cohort learning
- **Offline Mode**: Cached concepts and local-first architecture
