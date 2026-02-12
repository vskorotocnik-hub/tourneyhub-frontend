import type { UserProfile, UserMatch } from '../types';

export const userProfile: UserProfile = {
  id: 'user-1',
  username: 'MaxGamer',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MaxGamer',
  registeredAt: new Date('2024-01-10'),
  balance: 245.50,
  currency: 'USDT',
  rating: 1250,
};

export const upcomingMatches: UserMatch[] = [
  {
    id: 'match-1',
    gameName: 'PUBG Mobile',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1 TDM',
    opponent: {
      username: 'ProGamer228',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer228',
    },
    prize: 50,
    currency: 'USDT',
    scheduledAt: new Date('2024-01-26T15:00:00'),
    status: 'upcoming',
  },
  {
    id: 'match-2',
    gameName: 'Brawl Stars',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1 Showdown',
    opponent: {
      username: 'StarPlayer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StarPlayer',
    },
    prize: 25,
    currency: 'USDT',
    scheduledAt: new Date('2024-01-27T18:00:00'),
    status: 'upcoming',
  },
];

export const completedMatches: UserMatch[] = [
  {
    id: 'match-3',
    gameName: 'Brawl Stars',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1 Showdown',
    opponent: {
      username: 'NinjaWarrior',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaWarrior',
    },
    prize: 25,
    currency: 'USDT',
    completedAt: new Date('2024-01-25T12:00:00'),
    result: 'win',
    status: 'completed',
  },
  {
    id: 'match-4',
    gameName: 'Clash Royale',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1 Bo3',
    opponent: {
      username: 'ShadowMaster',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowMaster',
    },
    prize: 30,
    currency: 'USDT',
    completedAt: new Date('2024-01-24T16:00:00'),
    result: 'lose',
    status: 'completed',
  },
  {
    id: 'match-5',
    gameName: 'PUBG Mobile',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1 TDM',
    opponent: {
      username: 'DragonSlayer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',
    },
    prize: 100,
    currency: 'USDT',
    completedAt: new Date('2024-01-23T14:00:00'),
    result: 'win',
    status: 'completed',
  },
  {
    id: 'match-6',
    gameName: 'Mobile Legends',
    gameImage: 'https://cdn2.unrealengine.com/Fortnite%2Fbattle-royale%2Ffortnite-sniper-702x702-702x702-1e69fc4c3e3f6e0ccf77c5e7a60e9cd8bcd23649.jpg',
    format: '1v1',
    opponent: {
      username: 'PhoenixRise',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhoenixRise',
    },
    prize: 40,
    currency: 'USDT',
    completedAt: new Date('2024-01-22T20:00:00'),
    result: 'win',
    status: 'completed',
  },
];
