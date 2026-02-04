# CodeMentor Project Overview

## Vision

An AI-powered learning platform that guides developers through projects using Socratic questioning, without providing code. We solve the "vibe coding makes juniors worse" problem by combining AI guidance with skill-building rigor.

## Problem Statement

- Experienced devs like Andrej Karpathy report 80% AI-generated code and benefit from it
- Anthropic research shows beginners using AI score 40% worse on assessments
- Juniors produce working code without understanding why it works
- Traditional learning has high dropout rates due to lack of guidance

## Solution

**CodeMentor** bridges this gap:

- Socratic questioning over direct answers
- Code review that probes understanding
- Concept tracking with spaced repetition
- Visual learning graph showing progress

## Key Differentiators

1. **Refuses to give code** - enforces learning through doing
2. **Maintains learning state** - tracks progress across months
3. **Visual knowledge graph** - shows interconnected concept mastery
4. **Spaced repetition** - naturally reinforces old concepts
5. **Senior dev tone** - direct, kind feedback (not cheerleader AI)

## Target Market

- **B2C**: Career changers, self-taught devs, bootcamp students
- **B2B**: Coding bootcamps, tech companies training juniors

## Monetization

- Free: 1 project
- Pro ($15/mo): Unlimited projects + graph + reviews
- Teams ($50/user/mo): Company dashboards, custom curricula

## Tech Stack (Proposed)

- Runtime: Node.js + TypeScript
- CLI: Commander.js or Oclif
- Backend: Hono or Fastify
- Database: PostgreSQL + Drizzle ORM
- AI: Anthropic Claude API
- Auth: Clerk or Auth.js
- Hosting: Railway/Render (API), Vercel (Web)

## Development Phases

1. **Phase 0**: Foundation & Planning (This week)
2. **Phase 1**: Core CLI MVP (Weeks 1-2)
3. **Phase 2**: Concept Tracking (Week 3)
4. **Phase 3**: Web Dashboard (Weeks 4-5)
5. **Phase 4**: Code Review & Sandbox (Weeks 6-7)
6. **Phase 5**: Beta Launch (Week 8)

## Success Metrics

- 50+ beta users
- 10+ users complete full projects
- NPS > 40
- At least 1 B2B lead interested

## Links

- [Anthropic Study on AI & Learning](https://www.anthropic.com/research/AI-assistance-coding-skills)
- [Linear Project](https://linear.app/cesarworkspace/document/project-overview-and-vision-ef522bda895a)
