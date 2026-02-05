import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Lock, PlayCircle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  order: number;
  status: string;
  conceptIds: string[];
}

interface TaskListProps {
  tasks: Task[];
  currentTaskId: string | null;
}

const STATUS_ICONS = {
  locked: Lock,
  available: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
} as const;

const STATUS_COLORS = {
  locked: 'text-gray-400',
  available: 'text-blue-500',
  in_progress: 'text-yellow-500',
  completed: 'text-green-500',
} as const;

export function TaskList({ tasks, currentTaskId }: TaskListProps) {
  return (
    <div className="space-y-4">
      {tasks
        .sort((a, b) => a.order - b.order)
        .map((task) => {
          const Icon = STATUS_ICONS[task.status as keyof typeof STATUS_ICONS] ?? Circle;
          const isCurrentTask = task.id === currentTaskId;

          return (
            <div
              key={task.id}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                isCurrentTask && 'border-primary bg-primary/5',
                task.status === 'locked' && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    'mt-0.5 h-5 w-5',
                    STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] ?? 'text-gray-400'
                  )}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium">
                      {task.order}. {task.title}
                    </h4>
                    {isCurrentTask && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {task.status === 'completed' && (
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  {task.objectives.length > 0 && task.status !== 'locked' && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground">Objectives:</p>
                      <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                        {task.objectives.map((obj, i) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.conceptIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {task.conceptIds.map((conceptId) => (
                        <Badge key={conceptId} variant="outline" className="text-xs">
                          {conceptId}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
