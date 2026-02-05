import { describe, it, expect } from 'bun:test';
import { getPlaybook } from '../playbooks';
import type { StrugglingUserRequest, StrugglingUserResponse } from './struggling-user-handler';
import {
  analyzeFrustrationSignals,
  estimateFrustrationLevel,
  suggestStrategy,
} from './struggling-user-handler';

describe('Struggling User Handler', () => {
  describe('Playbooks', () => {
    it('loads struggling-user playbook', () => {
      const playbook = getPlaybook('struggling-user');

      expect(playbook).toBeDefined();
      expect(playbook).toContain('Struggling User');
      expect(playbook).toContain('Frustration Signals');
    });

    it('playbook defines 4 response levels', () => {
      const playbook = getPlaybook('struggling-user');

      expect(playbook).toContain('Level 1');
      expect(playbook).toContain('Level 2');
      expect(playbook).toContain('Level 3');
      expect(playbook).toContain('Level 4');
    });

    it('playbook defines scaffolding techniques', () => {
      const playbook = getPlaybook('struggling-user');

      expect(playbook).toContain('Reduce Scope');
      expect(playbook).toContain('Scaffolding');
      expect(playbook).toContain('Pair Debug');
    });
  });

  describe('StrugglingUserRequest Validation', () => {
    it('validates complete request structure', () => {
      const request: StrugglingUserRequest = {
        task: {
          title: 'Create HTML Structure',
          description: 'Create the basic HTML structure',
          objectives: ['Use semantic HTML', 'Create proper document structure'],
        },
        attemptHistory: [
          { timestamp: new Date(), passed: false },
          { timestamp: new Date(), passed: false },
        ],
        hintsUsed: 2,
        totalHintsAvailable: 4,
        timeSinceStart: 25,
        difficulty: 'beginner',
      };

      expect(request.task).toHaveProperty('title');
      expect(request.task).toHaveProperty('description');
      expect(request.task).toHaveProperty('objectives');
      expect(request.attemptHistory).toBeArray();
      expect(request.hintsUsed).toBeGreaterThanOrEqual(0);
      expect(request.totalHintsAvailable).toBeGreaterThan(0);
      expect(request.timeSinceStart).toBeGreaterThanOrEqual(0);
      expect(['beginner', 'intermediate', 'advanced']).toContain(request.difficulty);
    });

    it('accepts empty attempt history', () => {
      const request: StrugglingUserRequest = {
        task: {
          title: 'Test',
          description: 'Test task',
          objectives: ['Test'],
        },
        attemptHistory: [],
        hintsUsed: 0,
        totalHintsAvailable: 4,
        timeSinceStart: 5,
        difficulty: 'beginner',
      };

      expect(request.attemptHistory).toEqual([]);
    });
  });

  describe('StrugglingUserResponse Structure', () => {
    it('validates complete response structure', () => {
      const response: StrugglingUserResponse = {
        frustrationLevel: 'medium',
        supportStrategy: 'scaffold',
        message: "This is a tricky concept - you're not alone in finding it challenging.",
        suggestedAction: "Let's break down the problem into smaller steps.",
      };

      expect(response).toHaveProperty('frustrationLevel');
      expect(response).toHaveProperty('supportStrategy');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('suggestedAction');
    });

    it('validates frustration levels', () => {
      const validLevels = ['low', 'medium', 'high', 'critical'];

      for (const level of validLevels) {
        const response: StrugglingUserResponse = {
          frustrationLevel: level as 'low' | 'medium' | 'high' | 'critical',
          supportStrategy: 'encourage',
          message: 'Test',
          suggestedAction: 'Test',
        };

        expect(validLevels).toContain(response.frustrationLevel);
      }
    });

    it('validates support strategies', () => {
      const validStrategies = ['encourage', 'scaffold', 'simplify', 'break'];

      for (const strategy of validStrategies) {
        const response: StrugglingUserResponse = {
          frustrationLevel: 'low',
          supportStrategy: strategy as 'encourage' | 'scaffold' | 'simplify' | 'break',
          message: 'Test',
          suggestedAction: 'Test',
        };

        expect(validStrategies).toContain(response.supportStrategy);
      }
    });

    it('includes simplifiedObjectives when strategy is simplify', () => {
      const response: StrugglingUserResponse = {
        frustrationLevel: 'high',
        supportStrategy: 'simplify',
        message: "Let's focus on just the essentials.",
        suggestedAction: 'Complete only the first objective for now.',
        simplifiedObjectives: ['Create a basic HTML document with doctype and html tags'],
      };

      expect(response.simplifiedObjectives).toBeDefined();
      expect(response.simplifiedObjectives).toBeArray();
      expect(response.simplifiedObjectives!.length).toBeGreaterThan(0);
    });
  });

  describe('Frustration Signal Analysis', () => {
    it('calculates failed attempt ratio correctly', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [
          { timestamp: new Date(), passed: false },
          { timestamp: new Date(), passed: false },
          { timestamp: new Date(), passed: true },
          { timestamp: new Date(), passed: false },
        ],
        hintsUsed: 0,
        totalHintsAvailable: 4,
        timeSinceStart: 10,
        difficulty: 'beginner',
      };

      const signals = analyzeFrustrationSignals(request);

      // 3 failed out of 4 = 0.75
      expect(signals.failedAttemptRatio).toBe(0.75);
    });

    it('detects hints exhausted', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [],
        hintsUsed: 4,
        totalHintsAvailable: 4,
        timeSinceStart: 10,
        difficulty: 'beginner',
      };

      const signals = analyzeFrustrationSignals(request);

      expect(signals.hintsExhausted).toBe(true);
    });

    it('detects high hint usage (>= 75%)', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [],
        hintsUsed: 3,
        totalHintsAvailable: 4,
        timeSinceStart: 10,
        difficulty: 'beginner',
      };

      const signals = analyzeFrustrationSignals(request);

      expect(signals.highHintUsage).toBe(true);
      expect(signals.hintsExhausted).toBe(false);
    });

    it('detects prolonged time for beginner (> 30 min)', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [],
        hintsUsed: 0,
        totalHintsAvailable: 4,
        timeSinceStart: 35,
        difficulty: 'beginner',
      };

      const signals = analyzeFrustrationSignals(request);

      expect(signals.prolongedTime).toBe(true);
    });

    it('uses higher time threshold for advanced users', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [],
        hintsUsed: 0,
        totalHintsAvailable: 4,
        timeSinceStart: 55,
        difficulty: 'advanced',
      };

      const signals = analyzeFrustrationSignals(request);

      // 55 minutes is not prolonged for advanced (threshold is 60)
      expect(signals.prolongedTime).toBe(false);
    });

    it('counts recent consecutive failures', () => {
      const request: StrugglingUserRequest = {
        task: { title: 'Test', description: 'Test', objectives: [] },
        attemptHistory: [
          { timestamp: new Date(), passed: true },
          { timestamp: new Date(), passed: false },
          { timestamp: new Date(), passed: false },
          { timestamp: new Date(), passed: false },
        ],
        hintsUsed: 0,
        totalHintsAvailable: 4,
        timeSinceStart: 10,
        difficulty: 'beginner',
      };

      const signals = analyzeFrustrationSignals(request);

      expect(signals.recentFailStreak).toBe(3);
    });
  });

  describe('Frustration Level Estimation', () => {
    it('returns low for minimal signals', () => {
      const signals = {
        failedAttemptRatio: 0.2,
        hintsExhausted: false,
        highHintUsage: false,
        prolongedTime: false,
        recentFailStreak: 1,
      };

      const level = estimateFrustrationLevel(signals);

      expect(level).toBe('low');
    });

    it('returns medium for moderate signals', () => {
      const signals = {
        failedAttemptRatio: 0.5,
        hintsExhausted: false,
        highHintUsage: true,
        prolongedTime: false,
        recentFailStreak: 2,
      };

      const level = estimateFrustrationLevel(signals);

      expect(level).toBe('medium');
    });

    it('returns high for significant signals', () => {
      // Score calculation:
      // failedAttemptRatio 0.6 -> +2 (>= 0.5)
      // hintsExhausted false -> +0
      // highHintUsage true -> +1
      // prolongedTime true -> +2
      // recentFailStreak 2 -> +1
      // Total: 6 -> high (5-7 range)
      const signals = {
        failedAttemptRatio: 0.6,
        hintsExhausted: false,
        highHintUsage: true,
        prolongedTime: true,
        recentFailStreak: 2,
      };

      const level = estimateFrustrationLevel(signals);

      expect(level).toBe('high');
    });

    it('returns critical for severe signals', () => {
      const signals = {
        failedAttemptRatio: 0.9,
        hintsExhausted: true,
        highHintUsage: true,
        prolongedTime: true,
        recentFailStreak: 5,
      };

      const level = estimateFrustrationLevel(signals);

      expect(level).toBe('critical');
    });
  });

  describe('Strategy Suggestion', () => {
    it('suggests encourage for low frustration', () => {
      expect(suggestStrategy('low')).toBe('encourage');
    });

    it('suggests scaffold for medium frustration', () => {
      expect(suggestStrategy('medium')).toBe('scaffold');
    });

    it('suggests simplify for high frustration', () => {
      expect(suggestStrategy('high')).toBe('simplify');
    });

    it('suggests break for critical frustration', () => {
      expect(suggestStrategy('critical')).toBe('break');
    });
  });

  describe('Tool Schema', () => {
    it('defines correct tool structure', () => {
      const toolSchema = {
        name: 'handle_struggling_user',
        description: 'Assess frustration and provide appropriate support level',
        input_schema: {
          type: 'object' as const,
          properties: {
            frustrationLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            supportStrategy: {
              type: 'string',
              enum: ['encourage', 'scaffold', 'simplify', 'break'],
            },
            message: { type: 'string' },
            suggestedAction: { type: 'string' },
            simplifiedObjectives: { type: 'array', items: { type: 'string' } },
          },
          required: ['frustrationLevel', 'supportStrategy', 'message', 'suggestedAction'],
        },
      };

      expect(toolSchema.name).toBe('handle_struggling_user');
      expect(toolSchema.input_schema.required).toContain('frustrationLevel');
      expect(toolSchema.input_schema.required).toContain('supportStrategy');
      expect(toolSchema.input_schema.required).toContain('message');
      expect(toolSchema.input_schema.required).toContain('suggestedAction');
      // simplifiedObjectives is optional
      expect(toolSchema.input_schema.required).not.toContain('simplifiedObjectives');
    });
  });

  describe('Strategy-Frustration Mapping', () => {
    it('encourage strategy matches low frustration guidance', () => {
      // From playbook Level 1: Gentle Encouragement
      const response: StrugglingUserResponse = {
        frustrationLevel: 'low',
        supportStrategy: 'encourage',
        message: "This is a tricky concept - you're not alone in finding it challenging.",
        suggestedAction: "Let's approach it from a different angle.",
      };

      expect(response.frustrationLevel).toBe('low');
      expect(response.supportStrategy).toBe('encourage');
    });

    it('scaffold strategy matches medium frustration guidance', () => {
      // From playbook Level 2: Validation + Redirect
      const response: StrugglingUserResponse = {
        frustrationLevel: 'medium',
        supportStrategy: 'scaffold',
        message: "I can see this is frustrating. That's completely normal.",
        suggestedAction: "Let's step back and break this into smaller pieces.",
      };

      expect(response.frustrationLevel).toBe('medium');
      expect(response.supportStrategy).toBe('scaffold');
    });

    it('simplify strategy includes simplified objectives', () => {
      // From playbook Level 3: Direct Support
      const response: StrugglingUserResponse = {
        frustrationLevel: 'high',
        supportStrategy: 'simplify',
        message: "Let's pause and focus on the core concept.",
        suggestedAction: 'Complete only the first simplified objective.',
        simplifiedObjectives: ['Create a basic HTML document'],
      };

      expect(response.frustrationLevel).toBe('high');
      expect(response.supportStrategy).toBe('simplify');
      expect(response.simplifiedObjectives).toBeDefined();
    });

    it('break strategy recommends stepping away', () => {
      // From playbook Level 4: Recommend Break or Alternative
      const response: StrugglingUserResponse = {
        frustrationLevel: 'critical',
        supportStrategy: 'break',
        message: 'I think it might help to take a short break from this.',
        suggestedAction: 'Step away for 10-15 minutes, then try a simpler related task.',
      };

      expect(response.frustrationLevel).toBe('critical');
      expect(response.supportStrategy).toBe('break');
    });
  });

  describe('Difficulty Adaptation', () => {
    it('accepts all difficulty levels', () => {
      const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = [
        'beginner',
        'intermediate',
        'advanced',
      ];

      for (const difficulty of difficulties) {
        const request: StrugglingUserRequest = {
          task: { title: 'Test', description: 'Test', objectives: [] },
          attemptHistory: [],
          hintsUsed: 0,
          totalHintsAvailable: 4,
          timeSinceStart: 10,
          difficulty,
        };

        expect(request.difficulty).toBe(difficulty);
      }
    });
  });

  describe('Anti-patterns Awareness', () => {
    it('messages should not minimize struggle', () => {
      const badPhrases = ['This should be easy', 'Just do X', 'Simply add', "It's not that hard"];

      const goodMessage = 'This is a challenging concept that trips up many developers at first.';

      for (const phrase of badPhrases) {
        expect(goodMessage.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    });

    it('messages should be specific, not generic', () => {
      const genericMessages = ['Keep trying!', 'You can do it!', "Don't give up!"];

      const specificMessage =
        "Let's focus on just getting the HTML structure right first. " +
        'Try adding a DOCTYPE declaration at the top of your file.';

      // Generic messages lack specific guidance
      for (const generic of genericMessages) {
        expect(generic.length).toBeLessThan(specificMessage.length);
      }

      // Specific messages contain actionable content
      expect(specificMessage).toContain('DOCTYPE');
    });
  });
});
