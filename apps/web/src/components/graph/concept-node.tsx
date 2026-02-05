'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConceptGraphNode } from '@codementor/shared';

interface ConceptNodeData extends ConceptGraphNode {
  categoryColor: string;
}

const STATUS_COLORS = {
  not_started: 'bg-mastery-not-started',
  in_progress: 'bg-mastery-in-progress',
  mastered: 'bg-mastery-mastered',
} as const;

const STATUS_BORDERS = {
  not_started: 'border-gray-400',
  in_progress: 'border-blue-400',
  mastered: 'border-green-400',
} as const;

export const ConceptNode = memo(function ConceptNode({ data }: NodeProps) {
  const nodeData = data as unknown as ConceptNodeData;
  const {
    name,
    category,
    tier,
    masteryLevel,
    status,
    isDueForReview,
    isStruggling,
    lastPracticedAt,
  } = nodeData;

  const isRecent =
    lastPracticedAt &&
    new Date().getTime() - new Date(lastPracticedAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative rounded-lg border-2 bg-white px-3 py-2 shadow-md transition-all',
              STATUS_BORDERS[status],
              isDueForReview && 'glow-review',
              isRecent && status !== 'not_started' && 'glow-recent'
            )}
          >
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />

            <div className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', STATUS_COLORS[status])} />
              <span className="text-xs font-medium">{name}</span>
            </div>

            {masteryLevel !== null && (
              <div className="mt-1 text-[10px] text-muted-foreground">{masteryLevel}% mastery</div>
            )}

            {isStruggling && (
              <div
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500"
                title="Struggling"
              />
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              Category: {category} | Tier {tier}
            </p>
            <p className="text-xs">
              Status: <span className="capitalize">{status.replace('_', ' ')}</span>
              {masteryLevel !== null && ` (${masteryLevel}%)`}
            </p>
            {isDueForReview && <p className="text-xs text-orange-500">Due for review</p>}
            {isStruggling && <p className="text-xs text-orange-500">Needs extra practice</p>}
            {lastPracticedAt && (
              <p className="text-xs text-muted-foreground">
                Last practiced: {new Date(lastPracticedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
