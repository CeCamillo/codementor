import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env['ANTHROPIC_API_KEY'];

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set - AI features will not work');
}

export const anthropic = new Anthropic({
  apiKey: apiKey ?? '',
});

export const MODELS = {
  SONNET: 'claude-sonnet-4-20250514',
  HAIKU: 'claude-3-5-haiku-20241022',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];
