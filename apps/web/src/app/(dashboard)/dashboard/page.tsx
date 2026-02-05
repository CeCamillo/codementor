'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isNoActiveProjectResponse } from '@codementor/shared';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { CurrentProjectCard } from '@/components/dashboard/current-project-card';
import { ConceptsDueCard } from '@/components/dashboard/concepts-due-card';
import { RecentConceptsCard } from '@/components/dashboard/recent-concepts-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => api.getProgress(),
  });

  const { data: conceptsDue, isLoading: conceptsDueLoading } = useQuery({
    queryKey: ['concepts-due'],
    queryFn: () => api.getConceptsDue(),
  });

  if (progressLoading) {
    return <DashboardSkeleton />;
  }

  const hasActiveProject = progress && !isNoActiveProjectResponse(progress);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your learning progress and active projects.</p>
      </div>

      {hasActiveProject ? (
        <>
          <StatsGrid
            tasksCompleted={progress.tasks.completed}
            tasksTotal={progress.tasks.total}
            conceptsMastered={progress.concepts.mastered}
            conceptsInProgress={progress.concepts.inProgress}
            currentStreak={progress.streak.currentDays}
            activeToday={progress.streak.activeToday}
            investedMinutes={progress.time.investedMinutes}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <CurrentProjectCard
              project={progress.project}
              currentTask={progress.currentTask}
              tasks={progress.tasks}
            />
            <div className="space-y-6">
              <ConceptsDueCard
                concepts={conceptsDue?.concepts ?? []}
                isLoading={conceptsDueLoading}
              />
              <RecentConceptsCard concepts={progress.concepts.recent} />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No Active Project</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a new project using the CLI:{' '}
            <code className="rounded bg-muted px-1">codementor start</code>
          </p>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
