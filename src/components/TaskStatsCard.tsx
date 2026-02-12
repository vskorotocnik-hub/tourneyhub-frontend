import { memo } from 'react';
import type { TaskStats } from '../types';

interface TaskStatsCardProps {
  stats: TaskStats;
}

const TaskStatsCard = memo(({ stats }: TaskStatsCardProps) => {
  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm 
                    rounded-xl border border-white/20 p-4">
      <div className="flex items-center justify-between">
        {/* Total Earned */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 
                        flex items-center justify-center text-2xl">
            💰
          </div>
          <div>
            <p className="text-xs text-white/60">Заработано за задания</p>
            <p className="text-xl font-bold text-white">
              {stats.totalEarned} <span className="text-sm text-accent-green">{stats.currency}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{stats.completedTasks}</p>
            <p className="text-xs text-white/50">Выполнено</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{stats.availableTasks}</p>
            <p className="text-xs text-white/50">Доступно</p>
          </div>
        </div>
      </div>
    </div>
  );
});

TaskStatsCard.displayName = 'TaskStatsCard';

export default TaskStatsCard;
