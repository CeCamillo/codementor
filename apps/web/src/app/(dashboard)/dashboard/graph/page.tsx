'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LearningGraph } from '@/components/graph/learning-graph';
import { MobileConceptList } from '@/components/graph/mobile-concept-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function GraphPage() {
  const {
    data: graphData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['concept-graph'],
    queryFn: () => api.getConceptGraph(),
  });

  if (isLoading) {
    return <GraphSkeleton />;
  }

  if (error || !graphData) {
    return (
      <div className="rounded-lg border border-destructive p-6 text-center">
        <p className="text-destructive">Failed to load concept graph</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Graph</h1>
          <p className="text-muted-foreground">Visualize your concept mastery and progress.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mastery-mastered" />
            Mastered: {graphData.summary.mastered}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mastery-in-progress" />
            In Progress: {graphData.summary.inProgress}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mastery-not-started" />
            Not Started: {graphData.summary.notStarted}
          </Badge>
        </div>
      </div>

      {/* Desktop: Interactive graph */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Concept Map</CardTitle>
          <CardDescription>
            Nodes represent concepts. Edges show prerequisites. Hover over nodes for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <LearningGraph nodes={graphData.nodes} edges={graphData.edges} />
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Category list view */}
      <div className="md:hidden">
        <MobileConceptList nodes={graphData.nodes} />
      </div>
    </div>
  );
}

function GraphSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
