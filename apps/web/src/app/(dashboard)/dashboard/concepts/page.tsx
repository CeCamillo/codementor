'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConceptsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['concepts'],
    queryFn: () => api.getConcepts(),
  });

  if (isLoading) {
    return <ConceptsSkeleton />;
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive p-6 text-center">
        <p className="text-destructive">Failed to load concepts</p>
      </div>
    );
  }

  const { concepts, summary } = data;

  // Group by category
  const groupedConcepts = concepts.reduce(
    (acc, concept) => {
      if (!acc[concept.category]) {
        acc[concept.category] = [];
      }
      acc[concept.category]!.push(concept);
      return acc;
    },
    {} as Record<string, typeof concepts>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Concepts</h1>
        <p className="text-muted-foreground">Track your mastery of programming concepts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <Progress
              value={(summary.mastered / Math.max(summary.total, 1)) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.mastered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Due for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.dueForReview}</div>
          </CardContent>
        </Card>
      </div>

      {/* Concepts by Category */}
      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({concepts.length})</TabsTrigger>
          {Object.entries(groupedConcepts).map(([category, items]) => (
            <TabsTrigger key={category} value={category}>
              {category} ({items.length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ConceptGrid concepts={concepts} />
        </TabsContent>

        {Object.entries(groupedConcepts).map(([category, items]) => (
          <TabsContent key={category} value={category} className="mt-6">
            <ConceptGrid concepts={items} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ConceptGrid({
  concepts,
}: {
  concepts: Array<{
    conceptId: string;
    name: string;
    category: string;
    masteryLevel: number;
    practiceCount: number;
    status: 'not_started' | 'in_progress' | 'mastered';
    isDueForReview: boolean;
    isStruggling: boolean;
    lastPracticedAt: string | null;
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {concepts.map((concept) => (
        <Card
          key={concept.conceptId}
          className={cn(
            'transition-colors',
            concept.isDueForReview && 'border-orange-200 bg-orange-50/50'
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{concept.name}</CardTitle>
              <StatusIcon status={concept.status} />
            </div>
            <CardDescription>{concept.category}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Mastery</span>
                <span className="font-medium">{concept.masteryLevel}%</span>
              </div>
              <Progress value={concept.masteryLevel} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-2">
              {concept.isDueForReview && (
                <Badge variant="warning" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Due for review
                </Badge>
              )}
              {concept.isStruggling && (
                <Badge variant="destructive" className="text-xs">
                  Needs practice
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {concept.practiceCount} practices
              </Badge>
            </div>

            {concept.lastPracticedAt && (
              <p className="text-xs text-muted-foreground">
                Last practiced: {new Date(concept.lastPracticedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: 'not_started' | 'in_progress' | 'mastered' }) {
  switch (status) {
    case 'mastered':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'in_progress':
      return <AlertCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function ConceptsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
