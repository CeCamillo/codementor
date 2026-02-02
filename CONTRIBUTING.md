# Contributing to CodeMentor

Thank you for your interest in contributing to CodeMentor!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- PostgreSQL 15+
- Git

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/cesarcamillo/codementor.git
cd codementor
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the development server:

```bash
bun run dev
```

## Project Structure

```
codementor/
├── apps/
│   ├── cli/        # CLI application
│   ├── api/        # Backend API
│   └── web/        # Web dashboard
├── packages/
│   ├── shared/     # Shared types and utilities
│   ├── ai/         # AI prompts and concepts
│   └── db/         # Database schema
```

## Code Style

We use automated tooling to maintain consistent code style:

- **ESLint** for code quality rules
- **Prettier** for formatting
- **TypeScript** strict mode for type safety

Run checks locally:

```bash
bun run lint        # Check for issues
bun run lint:fix    # Fix auto-fixable issues
bun run format      # Format code
bun run typecheck   # Check types
```

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Use conventional commits:

- `feat: add login command`
- `fix: handle empty project list`
- `docs: update API documentation`
- `refactor: simplify task validation`

Keep commits focused and atomic. Each commit should represent a single logical change.

### Pull Requests

1. Create a branch from `develop`
2. Make your changes
3. Ensure all checks pass (`bun run lint && bun run typecheck && bun run test`)
4. Push and create a PR targeting `develop`
5. Fill out the PR template
6. Request review

## Testing

Write tests for new functionality:

```bash
bun run test                    # Run all tests
bun run test --filter=cli      # Run tests for specific package
```

Test files should be named `*.test.ts` and placed alongside the code they test.

## Architecture Guidelines

### Type Safety

- Avoid `any` types
- Use strict TypeScript configuration
- Prefer type inference where possible
- Export types from `@codementor/shared`

### Error Handling

- Use the `Result` type from `@codementor/shared` for operations that can fail
- Provide meaningful error messages
- Log errors with context for debugging

### AI Integration

- All prompts live in `packages/ai/playbooks/`
- Test prompts before committing changes
- Consider token costs and rate limits

## Getting Help

- Open a [discussion](https://github.com/cesarcamillo/codementor/discussions) for questions
- Check existing issues before creating new ones
- Join our community chat (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
