import type { WoWMap, WoWMatch, TournamentLeader } from '../types';

export const wowMaps: WoWMap[] = [
  {
    id: 'map-1',
    mapId: '847291',
    name: 'OFFICIAL 2v2 WOW MAP',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    format: '2v2',
    teamCount: 2,
    playersPerTeam: 2,
    rounds: 9,
    rules: '1 ROUND 15 KILLS, TOTAL 9 ROUND'
  },
  {
    id: 'map-2',
    mapId: '653827',
    name: 'OSE CLASH 3v3 12R IN ERANGEL',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop',
    format: '3v3',
    teamCount: 2,
    playersPerTeam: 3,
    rounds: 12,
    rules: '3VS3 CLOSE 12 ROUNDS'
  },
  {
    id: 'map-3',
    mapId: '192847',
    name: 'AR 1v1 2v2 M416',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0e?w=400&h=300&fit=crop',
    format: '1v1 2v2',
    teamCount: 2,
    playersPerTeam: 2,
    rounds: 10,
    rules: 'M416 ONLY'
  },
  {
    id: 'map-4',
    mapId: '483920',
    name: 'FUN GUN GAME 2V2V2V2',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f2cd7?w=400&h=300&fit=crop',
    format: '2v2v2v2',
    teamCount: 4,
    playersPerTeam: 2,
    rounds: 1,
    rules: 'GUN GAME MODE'
  },
  {
    id: 'map-5',
    mapId: '728194',
    name: 'SNIPER 1v1 AWM ONLY',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=300&fit=crop',
    format: '1v1',
    teamCount: 2,
    playersPerTeam: 1,
    rounds: 15,
    rules: 'AWM ONLY, 15 KILLS'
  },
  {
    id: 'map-6',
    mapId: '394857',
    name: 'SQUAD ARENA 4v4',
    image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=300&fit=crop',
    format: '4v4',
    teamCount: 2,
    playersPerTeam: 4,
    rounds: 7,
    rules: 'FULL SQUAD BATTLE'
  }
];

export const wowActiveMatches: WoWMatch[] = [
  {
    id: 'wow-match-1',
    map: wowMaps[0],
    creatorId: 'user-2',
    creatorName: 'SnipeKing',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SnipeKing',
    bet: 10,
    server: 'europe',
    teamsJoined: 1,
    teamsNeeded: 2,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    searchTime: 300,
    status: 'searching'
  },
  {
    id: 'wow-match-2',
    map: wowMaps[3],
    creatorId: 'user-3',
    creatorName: 'ProPlayer',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProPlayer',
    bet: 25,
    server: 'asia',
    teamsJoined: 2,
    teamsNeeded: 4,
    createdAt: new Date(Date.now() - 12 * 60 * 1000),
    searchTime: 720,
    status: 'searching'
  },
  {
    id: 'wow-match-3',
    map: wowMaps[4],
    creatorId: 'user-4',
    creatorName: 'HeadshotMaster',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HeadshotMaster',
    bet: 5,
    server: 'europe',
    teamsJoined: 1,
    teamsNeeded: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    searchTime: 120,
    status: 'searching'
  }
];

export const wowLeaders: TournamentLeader[] = [
  { rank: 1, id: 'w1', username: 'WoWMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WoWMaster', wins: 89, earnings: 1540 },
  { rank: 2, id: 'w2', username: 'ArenaKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArenaKing', wins: 76, earnings: 1320 },
  { rank: 3, id: 'w3', username: 'ClashPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClashPro', wins: 71, earnings: 1180 },
  { rank: 4, id: 'w4', username: 'MapLegend', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MapLegend', wins: 65, earnings: 980 },
  { rank: 5, id: 'w5', username: 'RoundWinner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RoundWinner', wins: 58, earnings: 870 },
  { rank: 6, id: 'w6', username: 'SquadSlayer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SquadSlayer', wins: 52, earnings: 760 },
  { rank: 7, id: 'w7', username: 'GunGameGod', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GunGameGod', wins: 48, earnings: 690 },
  { rank: 8, id: 'w8', username: 'SniperAce', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SniperAce', wins: 44, earnings: 620 },
  { rank: 9, id: 'w9', username: 'ArenaChamp', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArenaChamp', wins: 41, earnings: 580 },
  { rank: 10, id: 'w10', username: 'WoWKiller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WoWKiller', wins: 38, earnings: 520 },
  { rank: 11, id: 'w11', username: 'MapMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MapMaster', wins: 35, earnings: 480 },
  { rank: 12, id: 'w12', username: 'ClashKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClashKing', wins: 32, earnings: 440 },
  { rank: 13, id: 'w13', username: 'ArenaSlayer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArenaSlayer', wins: 29, earnings: 400 },
  { rank: 14, id: 'w14', username: 'WoWPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WoWPro', wins: 26, earnings: 360 },
  { rank: 15, id: 'w15', username: 'RoundKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RoundKing', wins: 24, earnings: 330 },
  { rank: 16, id: 'w16', username: 'MapPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MapPro', wins: 22, earnings: 300 },
  { rank: 17, id: 'w17', username: 'ClashAce', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClashAce', wins: 20, earnings: 270 },
  { rank: 18, id: 'w18', username: 'ArenaAce', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArenaAce', wins: 18, earnings: 240 },
  { rank: 19, id: 'w19', username: 'WoWAce', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WoWAce', wins: 16, earnings: 210 },
  { rank: 20, id: 'w20', username: 'RoundAce', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RoundAce', wins: 14, earnings: 180 }
];

export const serverNames: Record<string, string> = {
  europe: '🇪🇺 Европа',
  na: '🇺🇸 С. Америка',
  asia: '🇯🇵 Азия',
  me: '🇦🇪 Бл. Восток',
  sa: '🇧🇷 Ю. Америка'
};
