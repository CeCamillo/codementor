# Project Breakdown Playbook

## Purpose
Guide the AI in breaking down user projects into learning tasks that build skills progressively.

## Principles

### 1. Progressive Complexity
- Start with the simplest possible implementation
- Each task should introduce 1-2 new concepts maximum
- Later tasks build on earlier tasks

### 2. Vertical Slices
- Each task should produce visible, working functionality
- Avoid "setup only" tasks that don't produce results
- User should be able to see progress after each task

### 3. Learning-First Decomposition
- Tasks should align with concept mastery
- Identify which concepts each task teaches
- Order tasks based on concept prerequisites

## Task Structure

Each task should have:

1. **Clear objective**: What the user will build
2. **Acceptance criteria**: How to know it's done
3. **Concepts practiced**: Which skills this develops
4. **Hints available**: Graduated help without answers

## Example Breakdown

### Project: Todo Application

**Task 1: Static HTML Structure**
- Concepts: html-structure, html-forms
- Objective: Create the todo input and list HTML
- Criteria: Valid HTML with semantic elements

**Task 2: Styling with Flexbox**
- Concepts: css-flexbox, css-selectors
- Objective: Make the todo list visually appealing
- Criteria: Responsive layout, proper spacing

**Task 3: Add Todo Items**
- Concepts: dom-manipulation, events
- Objective: Add items when form is submitted
- Criteria: Items appear in list, input clears

**Task 4: Complete/Delete Items**
- Concepts: events, js-arrays
- Objective: Toggle completion and remove items
- Criteria: Visual feedback on completion

**Task 5: Persist to localStorage**
- Concepts: local-storage, js-objects
- Objective: Save and load todos
- Criteria: Todos survive page refresh

## Prompt Template

```
You are breaking down a learning project for a {difficulty_level} developer.

Project: {project_description}

User's current mastery:
{concept_mastery_summary}

Create {num_tasks} tasks that:
1. Build on each other progressively
2. Match the user's skill level
3. Each introduces 1-2 new concepts
4. Each produces visible functionality

For each task, provide:
- Title (action-oriented)
- Description (what to build)
- Objectives (bullet points)
- Concepts (from the concept tree)
- Estimated difficulty (1-5)
```

## Difficulty Calibration

### Beginner
- Focus on Tier 1 concepts
- Provide more structure in task descriptions
- Smaller tasks with clearer acceptance criteria

### Intermediate
- Mix of Tier 1 and 2 concepts
- Less hand-holding in descriptions
- Tasks may combine multiple concepts

### Advanced
- Include Tier 3 concepts
- Emphasize best practices and edge cases
- Larger scope tasks with design decisions

## Anti-Patterns to Avoid

- **Too many setup tasks**: Don't have 3 tasks before anything works
- **Kitchen sink tasks**: Don't combine too many concepts
- **Vague objectives**: "Make it better" is not a task
- **No visible progress**: Every task should change something the user sees
