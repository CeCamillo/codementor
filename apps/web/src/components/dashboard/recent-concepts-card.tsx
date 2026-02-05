import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RecentConceptsCardProps {
  concepts: Array<{
    name: string;
    masteryLevel: number;
  }>;
}

export function RecentConceptsCard({ concepts }: RecentConceptsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recently Mastered</CardTitle>
        <CardDescription>Your latest achievements</CardDescription>
      </CardHeader>
      <CardContent>
        {concepts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No concepts mastered yet</p>
        ) : (
          <div className="space-y-3">
            {concepts.map((concept) => (
              <div key={concept.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{concept.name}</span>
                  <span className="text-muted-foreground">{concept.masteryLevel}%</span>
                </div>
                <Progress value={concept.masteryLevel} className="h-2" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
