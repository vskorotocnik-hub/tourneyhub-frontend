import { memo } from 'react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onClaim?: (task: Task) => void;
  onStart?: (task: Task) => void;
}

const TaskCard = memo(({ task, onClaim, onStart }: TaskCardProps) => {
  const progressPercent = Math.min((task.progress / task.target) * 100, 100);
  
  const getTypeColor = (type: Task['type']) => {
    switch (type) {
      case 'daily': return 'from-blue-500 to-cyan-500';
      case 'social': return 'from-pink-500 to-purple-500';
      case 'game': return 'from-orange-500 to-yellow-500';
      case 'special': return 'from-emerald-500 to-teal-500';
    }
  };

  const getTypeLabel = (type: Task['type']) => {
    switch (type) {
      case 'daily': return 'Ежедневное';
      case 'social': return 'Социальное';
      case 'game': return 'Игровое';
      case 'special': return 'Особое';
    }
  };

  return (
    <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 flex items-center gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(task.type)} 
                      flex items-center justify-center text-2xl shrink-0`}>
        {task.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getTypeColor(task.type)} text-white font-medium`}>
            {getTypeLabel(task.type)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white truncate">{task.title}</h3>
        <p className="text-xs text-white/60 truncate">{task.description}</p>
        
        {/* Progress bar */}
        {task.target > 1 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Прогресс</span>
              <span>{task.progress}/{task.target}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getTypeColor(task.type)} transition-all duration-300`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Reward & Action */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="text-right">
          <span className="text-sm font-bold text-accent-green">+{task.reward}</span>
          <span className="text-xs text-white/50 ml-1">{task.currency}</span>
        </div>
        
        {task.isClaimed ? (
          <span className="text-xs text-white/40 px-3 py-1.5">Получено ✓</span>
        ) : task.isCompleted ? (
          <button
            onClick={() => onClaim?.(task)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-green to-emerald-500 
                     text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Забрать
          </button>
        ) : (
          <button
            onClick={() => onStart?.(task)}
            className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20
                     text-white text-xs font-medium hover:bg-white/20 transition-colors"
          >
            Начать
          </button>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
