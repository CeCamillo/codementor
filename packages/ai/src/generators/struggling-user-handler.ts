import { anthropic, MODELS } from '../client';
import { getPlaybook } from '../playbooks';

export interface StrugglingUserRequest {
  task: {
    title: string;
    description: string;
    objectives: string[];
  };
  attemptHistory: Array<{ timestamp: Date; passed: boolean }>;
  hintsUsed: number;
  totalHintsAvailable: number;
  timeSinceStart: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface StrugglingUserResponse {
  frustrationLevel: 'low' | 'medium' | 'high' | 'critical';
  supportStrategy: 'encourage' | 'scaffold' | 'simplify' | 'break';
  message: string;
  suggestedAction: string;
  simplifiedObjectives?: string[];
}

const strugglingUserTool = {
  name: 'handle_struggling_user',
  description: 'Assess frustration and provide appropriate support level',
  input_schema: {
    type: 'object' as const,
    properties: {
      frustrationLevel: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description:
          'Assessed frustration level based on attempt history, hints used, and time spent',
      },
      supportStrategy: {
        type: 'string',
        enum: ['encourage', 'scaffold', 'simplify', 'break'],
        description:
          'encourage=gentle encouragement, scaffold=provide partial code structure, simplify=reduce task scope, break=suggest taking a break',
      },
      message: {
        type: 'string',
        description:
          'A supportive message appropriate to the frustration level. Be empathetic without being patronizing.',
      },
      suggestedAction: {
        type: 'string',
        description: 'A specific, actionable suggestion for what the learner should do next',
      },
      simplifiedObjectives: {
        type: 'array',
        items: { type: 'string' },
        description:
          'If strategy is simplify, provide a reduced set of objectives to focus on first. Otherwise omit.',
      },
    },
    required: ['frustrationLevel', 'supportStrategy', 'message', 'suggestedAction'],
  },
};

interface FrustrationSignals {
  failedAttemptRatio: number;
  hintsExhausted: boolean;
  highHintUsage: boolean;
  prolongedTime: boolean;
  recentFailStreak: number;
}

function analyzeFrustrationSignals(request: StrugglingUserRequest): FrustrationSignals {
  const failedAttempts = request.attemptHistory.filter((a) => !a.passed).length;
  const totalAttempts = request.attemptHistory.length;
  const failedAttemptRatio = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

  const hintsExhausted = request.hintsUsed >= request.totalHintsAvailable;
  const highHintUsage =
    request.totalHintsAvailable > 0 && request.hintsUsed / request.totalHintsAvailable >= 0.75;

  // Prolonged time thresholds based on difficulty
  const timeThresholds = {
    beginner: 30,
    intermediate: 45,
    advanced: 60,
  };
  const prolongedTime = request.timeSinceStart > timeThresholds[request.difficulty];

  // Count recent consecutive failures
  let recentFailStreak = 0;
  for (let i = request.attemptHistory.length - 1; i >= 0; i--) {
    if (!request.attemptHistory[i]!.passed) {
      recentFailStreak++;
    } else {
      break;
    }
  }

  return {
    failedAttemptRatio,
    hintsExhausted,
    highHintUsage,
    prolongedTime,
    recentFailStreak,
  };
}

function estimateFrustrationLevel(
  signals: FrustrationSignals
): 'low' | 'medium' | 'high' | 'critical' {
  let score = 0;

  // Scoring based on signals
  if (signals.failedAttemptRatio >= 0.8) score += 3;
  else if (signals.failedAttemptRatio >= 0.5) score += 2;
  else if (signals.failedAttemptRatio >= 0.3) score += 1;

  if (signals.hintsExhausted) score += 2;
  else if (signals.highHintUsage) score += 1;

  if (signals.prolongedTime) score += 2;

  if (signals.recentFailStreak >= 5) score += 3;
  else if (signals.recentFailStreak >= 3) score += 2;
  else if (signals.recentFailStreak >= 2) score += 1;

  // Map score to frustration level
  if (score >= 8) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function suggestStrategy(
  frustrationLevel: 'low' | 'medium' | 'high' | 'critical'
): 'encourage' | 'scaffold' | 'simplify' | 'break' {
  switch (frustrationLevel) {
    case 'low':
      return 'encourage';
    case 'medium':
      return 'scaffold';
    case 'high':
      return 'simplify';
    case 'critical':
      return 'break';
  }
}

export async function handleStrugglingUser(
  request: StrugglingUserRequest
): Promise<StrugglingUserResponse> {
  const strugglingUserPlaybook = getPlaybook('struggling-user');
  const signals = analyzeFrustrationSignals(request);
  const estimatedFrustration = estimateFrustrationLevel(signals);
  const suggestedStrategy = suggestStrategy(estimatedFrustration);

  const signalsContext = `## Detected Signals
- Failed attempt ratio: ${(signals.failedAttemptRatio * 100).toFixed(0)}%
- Hints used: ${request.hintsUsed}/${request.totalHintsAvailable} (${signals.hintsExhausted ? 'exhausted' : signals.highHintUsage ? 'high usage' : 'normal'})
- Time spent: ${request.timeSinceStart} minutes (${signals.prolongedTime ? 'prolonged' : 'normal'})
- Recent consecutive failures: ${signals.recentFailStreak}
- Estimated frustration: ${estimatedFrustration}
- Suggested strategy: ${suggestedStrategy}`;

  const attemptSummary =
    request.attemptHistory.length > 0
      ? `## Attempt History Summary
- Total attempts: ${request.attemptHistory.length}
- Passed: ${request.attemptHistory.filter((a) => a.passed).length}
- Failed: ${request.attemptHistory.filter((a) => !a.passed).length}`
      : 'No attempts recorded yet.';

  const systemPrompt = `${strugglingUserPlaybook}

---

You are assessing a ${request.difficulty} developer who may be struggling with a task.

${signalsContext}

RESPONSE STRATEGY GUIDELINES:

### For "encourage" (low frustration):
- Acknowledge effort
- Offer a different angle or approach
- Keep message brief and positive

### For "scaffold" (medium frustration):
- Validate the struggle
- Offer to break down the problem
- Provide a smaller intermediate goal

### For "simplify" (high frustration):
- Explicitly acknowledge this is challenging
- Reduce scope to essentials
- Provide simplified objectives that cover core concepts only

### For "break" (critical frustration):
- Recommend stepping away
- Offer alternatives (different task, concept review, simpler example)
- Be supportive without being dismissive

CRITICAL INSTRUCTIONS:
1. Match your message tone to the frustration level
2. Never be condescending ("This should be easy")
3. Never minimize ("Just do X")
4. Always provide a specific, actionable next step
5. If simplifying, provide 1-3 focused objectives that build to the full task
6. Be genuine and empathetic`;

  const userMessage = `Assess this struggling learner and provide appropriate support:

## Task: ${request.task.title}

${request.task.description}

### Current Objectives:
${request.task.objectives.map((obj) => `- ${obj}`).join('\n')}

${attemptSummary}

Difficulty: ${request.difficulty}
Time spent: ${request.timeSinceStart} minutes

Provide supportive guidance using the handle_struggling_user tool.`;

  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [strugglingUserTool],
    tool_choice: { type: 'tool', name: 'handle_struggling_user' },
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return valid struggling user response');
  }

  const generated = toolUse.input as StrugglingUserResponse;

  // Validate that simplifiedObjectives is provided when strategy is 'simplify'
  if (generated.supportStrategy === 'simplify' && !generated.simplifiedObjectives) {
    // Provide a default simplified objective based on the first task objective
    generated.simplifiedObjectives = request.task.objectives.slice(0, 1);
  }

  return generated;
}

// Export helper functions for testing
export { analyzeFrustrationSignals, estimateFrustrationLevel, suggestStrategy };
