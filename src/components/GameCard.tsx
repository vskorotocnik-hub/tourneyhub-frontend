import { memo } from 'react';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick?: (game: Game) => void;
}

const formatOnline = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const GameCard = memo(({ game, onClick }: GameCardProps) => {
  return (
    <button
      onClick={() => onClick?.(game)}
      className="group relative aspect-square rounded-2xl overflow-hidden 
                 bg-dark-200 border border-white/20 
                 hover:border-white/40 transition-all duration-300
                 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10
                 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
    >
      {/* Game Image */}
      <img
        src={game.image}
        alt={game.name}
        className="w-full h-full object-cover transition-transform duration-500 
                   group-hover:scale-110"
        loading="lazy"
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent 
                   opacity-80 group-hover:opacity-90 transition-opacity"
      />
      
      {/* Color Accent */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ backgroundColor: game.color }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <h3 className="text-sm md:text-base font-bold text-white truncate">
          {game.name}
        </h3>
        
        {/* Online Counter */}
        <div className="flex items-center gap-1.5 mt-1">
          <span 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: game.color }}
          />
          <span className="text-xs text-white/80">
            {formatOnline(game.online)} онлайн
          </span>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${game.color}30`,
        }}
      />
    </button>
  );
});

GameCard.displayName = 'GameCard';

export default GameCard;
