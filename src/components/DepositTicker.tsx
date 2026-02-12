import { memo } from 'react';
import type { Deposit } from '../types';

interface DepositTickerProps {
  deposits: Deposit[];
}

const DepositTicker = memo(({ deposits }: DepositTickerProps) => {
  const duplicatedDeposits = [...deposits, ...deposits];

  return (
    <div className="w-full overflow-hidden py-2 bg-gradient-to-r from-dark-300/50 via-dark-200/30 to-dark-300/50 rounded-xl border border-white/10">
      <div className="flex animate-slide-left">
        {duplicatedDeposits.map((deposit, index) => (
          <div
            key={`${deposit.id}-${index}`}
            className="flex items-center gap-2 px-4 min-w-max"
          >
            <img
              src={deposit.avatar}
              alt={deposit.username}
              className="w-8 h-8 rounded-full border-2 border-accent-green/50"
              loading="lazy"
            />
            <div className="flex flex-col">
              <span className="text-xs text-white/70 truncate max-w-[80px]">
                {deposit.username}
              </span>
              <span className="text-xs text-white/50">
                Куплено: {deposit.item || 'UC'}
              </span>
              <span className="text-sm font-semibold text-accent-green">
                +{deposit.amount} {deposit.currency}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
});

DepositTicker.displayName = 'DepositTicker';

export default DepositTicker;
