import { memo, useCallback } from 'react';
import type { Game } from '../types';
import GameCard from './GameCard';

interface GamesGridProps {
  games: Game[];
  onGameSelect?: (game: Game) => void;
}

const GamesGrid = memo(({ games, onGameSelect }: GamesGridProps) => {
  const handleGameClick = useCallback((game: Game) => {
    onGameSelect?.(game);
  }, [onGameSelect]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-white">
          Выбери игру
        </h2>
        <span className="text-sm text-white/50">
          {games.length} игр
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {games.map((game) => (
          <GameCard 
            key={game.id} 
            game={game} 
            onClick={handleGameClick}
          />
        ))}
      </div>
    </div>
  );
});

GamesGrid.displayName = 'GamesGrid';

export default GamesGrid;
