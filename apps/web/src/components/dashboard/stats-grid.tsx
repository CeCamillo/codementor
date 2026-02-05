import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Brain, Flame, Clock } from 'lucide-react';

interface StatsGridProps {
  tasksCompleted: number;
  tasksTotal: number;
  conceptsMastered: number;
  conceptsInProgress: number;
  currentStreak: number;
  activeToday: boolean;
  investedMinutes: number;
}

export function StatsGrid({
  tasksCompleted,
  tasksTotal,
  conceptsMastered,
  conceptsInProgress,
  currentStreak,
  activeToday,
  investedMinutes,
}: StatsGridProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tasksCompleted}/{tasksTotal}
          </div>
          <p className="text-xs text-muted-foreground">
            {tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0}% complete
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concepts</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conceptsMastered}</div>
          <p className="text-xs text-muted-foreground">
            mastered, {conceptsInProgress} in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame
            className={`h-4 w-4 ${activeToday ? 'text-orange-500' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak} days</div>
          <p className="text-xs text-muted-foreground">
            {activeToday ? 'Active today!' : 'Practice to extend!'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(investedMinutes)}</div>
          <p className="text-xs text-muted-foreground">on current project</p>
        </CardContent>
      </Card>
    </div>
  );
}
