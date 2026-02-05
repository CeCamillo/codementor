'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectCard } from '@/components/projects/project-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'not_started' | 'abandoned';

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  const filteredProjects =
    data?.projects.filter((p) => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    }) ?? [];

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">All your learning projects in one place.</p>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({data?.projects.length ?? 0})</TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({data?.projects.filter((p) => p.status === 'in_progress').length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({data?.projects.filter((p) => p.status === 'completed').length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="not_started">
            Not Started ({data?.projects.filter((p) => p.status === 'not_started').length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {statusFilter === 'all'
                  ? 'Start a new project using the CLI.'
                  : `No ${statusFilter.replace('_', ' ')} projects.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
