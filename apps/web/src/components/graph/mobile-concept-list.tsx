'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConceptGraphNode } from '@codementor/shared';

interface MobileConceptListProps {
  nodes: ConceptGraphNode[];
}

const STATUS_ICONS = {
  not_started: Clock,
  in_progress: AlertCircle,
  mastered: CheckCircle2,
} as const;

const STATUS_COLORS = {
  not_started: 'text-gray-500',
  in_progress: 'text-blue-500',
  mastered: 'text-green-500',
} as const;

export function MobileConceptList({ nodes }: MobileConceptListProps) {
  const groupedByCategory = useMemo(() => {
    const grouped = new Map<string, ConceptGraphNode[]>();
    for (const node of nodes) {
      const existing = grouped.get(node.category) ?? [];
      existing.push(node);
      grouped.set(node.category, existing);
    }
    return grouped;
  }, [nodes]);

  const getCategoryProgress = (categoryNodes: ConceptGraphNode[]) => {
    const mastered = categoryNodes.filter((n) => n.status === 'mastered').length;
    return Math.round((mastered / categoryNodes.length) * 100);
  };

  return (
    <div className="space-y-4">
      {Array.from(groupedByCategory.entries()).map(([category, categoryNodes]) => {
        const progress = getCategoryProgress(categoryNodes);
        const mastered = categoryNodes.filter((n) => n.status === 'mastered').length;
        const dueForReview = categoryNodes.filter((n) => n.isDueForReview).length;

        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category}</CardTitle>
                <Badge variant="outline">
                  {mastered}/{categoryNodes.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              {dueForReview > 0 && (
                <p className="text-xs text-orange-500">{dueForReview} due for review</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryNodes
                .sort((a, b) => a.tier - b.tier)
                .map((node) => {
                  const Icon = STATUS_ICONS[node.status];
                  return (
                    <div
                      key={node.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-2',
                        node.isDueForReview && 'border-orange-200 bg-orange-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', STATUS_COLORS[node.status])} />
                        <div>
                          <p className="text-sm font-medium">{node.name}</p>
                          <p className="text-xs text-muted-foreground">Tier {node.tier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {node.masteryLevel !== null ? (
                          <span className="text-sm font-medium">{node.masteryLevel}%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not started</span>
                        )}
                        {node.isStruggling && (
                          <Badge variant="warning" className="ml-2 text-xs">
                            Struggling
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
