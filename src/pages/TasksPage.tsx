import { useState, useCallback, useMemo } from 'react';
import type { Task } from '../types';
import TaskCard from '../components/TaskCard';
import TaskStatsCard from '../components/TaskStatsCard';
import { tasks, taskStats } from '../data/tasks';

type TaskFilter = 'all' | 'daily' | 'social' | 'game' | 'special';

const TasksPage = () => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks;
    return tasks.filter(task => task.type === activeFilter);
  }, [activeFilter]);

  const handleClaim = useCallback((task: Task) => {
    console.log('Claiming reward for:', task.title);
    // TODO: API call to claim reward
  }, []);

  const handleStart = useCallback((task: Task) => {
    console.log('Starting task:', task.title);
    // TODO: Navigate to task action (e.g., open Telegram channel)
  }, []);

  const filters: { key: TaskFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'daily', label: '📅 Ежедневные' },
    { key: 'social', label: '📱 Социальные' },
    { key: 'game', label: '🎮 Игровые' },
    { key: 'special', label: '💎 Особые' },
  ];

  return (
    <div className="min-h-screen pb-40">
      <div className="xl:flex">
        {/* Main Content - Left side */}
        <main className="flex-1 xl:max-w-[1200px] px-4 md:px-8 xl:pr-[300px] py-4 space-y-4">
          {/* Header */}
          <div className="pt-2">
            <h1 className="text-2xl font-bold text-white">Задания</h1>
            <p className="text-sm text-white/60">Выполняй задания и получай награды</p>
          </div>

          {/* Stats Card */}
          <TaskStatsCard stats={taskStats} />

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                          ${activeFilter === filter.key 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onClaim={handleClaim}
                onStart={handleStart}
              />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/50">Нет доступных заданий в этой категории</p>
            </div>
          )}
        </main>

        {/* Character - Right side (Desktop only) */}
        <div className="hidden xl:flex fixed right-8 top-20 items-start justify-end flex-shrink-0 pointer-events-none">
          <img 
            src="/задания.png" 
            alt="Character"
            className="h-[calc(100vh-120px)] w-auto object-contain"
            style={{ maxHeight: '880px', transform: 'translateY(-25px)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
