import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { UserConceptItem } from '@codementor/shared';

interface ConceptsDueCardProps {
  concepts: UserConceptItem[];
  isLoading: boolean;
}

export function ConceptsDueCard({ concepts, isLoading }: ConceptsDueCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Due for Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Due for Review</CardTitle>
          {concepts.length > 0 && <Badge variant="warning">{concepts.length}</Badge>}
        </div>
        <CardDescription>Concepts that need practice</CardDescription>
      </CardHeader>
      <CardContent>
        {concepts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No concepts due for review</p>
        ) : (
          <div className="space-y-2">
            {concepts.slice(0, 5).map((concept) => (
              <div
                key={concept.conceptId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  {concept.isStruggling && <AlertCircle className="h-4 w-4 text-orange-500" />}
                  <span className="text-sm font-medium">{concept.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {concept.masteryLevel}%
                </Badge>
              </div>
            ))}
            {concepts.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                +{concepts.length - 5} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
