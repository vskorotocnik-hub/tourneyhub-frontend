import type { TournamentLeader, ActiveTournament } from '../types';

export const tournamentLeaders: TournamentLeader[] = [
  { rank: 1, id: 'l1', username: 'ProKiller_99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProKiller', wins: 156, earnings: 2450 },
  { rank: 2, id: 'l2', username: 'HeadshotKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Headshot', wins: 142, earnings: 2180 },
  { rank: 3, id: 'l3', username: 'TDM_Master', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TDM', wins: 128, earnings: 1920 },
  { rank: 4, id: 'l4', username: 'SniperElite', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sniper', wins: 115, earnings: 1650 },
  { rank: 5, id: 'l5', username: 'RushB_Pro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RushB', wins: 108, earnings: 1480 },
  { rank: 6, id: 'l6', username: 'AimBot_Legal', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AimBot', wins: 99, earnings: 1350 },
  { rank: 7, id: 'l7', username: 'ClutchGod', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Clutch', wins: 92, earnings: 1220 },
  { rank: 8, id: 'l8', username: 'FragMachine', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frag', wins: 87, earnings: 1100 },
  { rank: 9, id: 'l9', username: 'SprayNPray', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spray', wins: 81, earnings: 980 },
  { rank: 10, id: 'l10', username: 'OneShot_Kill', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OneShot', wins: 76, earnings: 890 },
  { rank: 11, id: 'l11', username: 'SilentAssassin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Silent', wins: 72, earnings: 820 },
  { rank: 12, id: 'l12', username: 'QuickScope', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quick', wins: 68, earnings: 760 },
  { rank: 13, id: 'l13', username: 'NightHunter', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Night', wins: 64, earnings: 710 },
  { rank: 14, id: 'l14', username: 'StormRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Storm', wins: 61, earnings: 650 },
  { rank: 15, id: 'l15', username: 'DeathDealer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Death', wins: 58, earnings: 600 },
  { rank: 16, id: 'l16', username: 'GhostSniper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost', wins: 55, earnings: 560 },
  { rank: 17, id: 'l17', username: 'BulletStorm', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bullet', wins: 52, earnings: 520 },
  { rank: 18, id: 'l18', username: 'IronSight', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iron', wins: 49, earnings: 480 },
  { rank: 19, id: 'l19', username: 'ColdBlooded', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cold', wins: 46, earnings: 440 },
  { rank: 20, id: 'l20', username: 'WarMachine', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=War', wins: 43, earnings: 400 },
];

export const activeTournaments: ActiveTournament[] = [
  {
    id: 'at1',
    creatorId: 'u1',
    creatorName: 'SniperElite',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sniper',
    bet: 5,
    teamMode: 'solo',
    teamCount: 2,
    server: 'europe',
    playersJoined: 1,
    playersNeeded: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    status: 'searching',
  },
  {
    id: 'at2',
    creatorId: 'u2',
    creatorName: 'RushB_Pro',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RushB',
    bet: 10,
    teamMode: 'duo',
    teamCount: 2,
    server: 'europe',
    playersJoined: 3,
    playersNeeded: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 12),
    status: 'searching',
  },
  {
    id: 'at3',
    creatorId: 'u3',
    creatorName: 'HeadshotKing',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Headshot',
    bet: 3,
    teamMode: 'solo',
    teamCount: 4,
    server: 'asia',
    playersJoined: 2,
    playersNeeded: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 8),
    status: 'searching',
  },
  {
    id: 'at4',
    creatorId: 'u4',
    creatorName: 'ClutchGod',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Clutch',
    bet: 7,
    teamMode: 'solo',
    teamCount: 2,
    server: 'na',
    playersJoined: 1,
    playersNeeded: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
    status: 'searching',
  },
  {
    id: 'at5',
    creatorId: 'u5',
    creatorName: 'FragMachine',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frag',
    bet: 2,
    teamMode: 'duo',
    teamCount: 3,
    server: 'europe',
    playersJoined: 4,
    playersNeeded: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
    status: 'searching',
  },
];

export const serverNames: Record<string, string> = {
  europe: '🇪🇺 Европа',
  na: '🇺🇸 Северная Америка',
  asia: '🇯🇵 Азия',
  me: '🇦🇪 Ближний Восток',
  sa: '🇧🇷 Южная Америка',
};

export type ClassicMode = 'solo' | 'duo' | 'squad';

export interface ClassicTournament {
  id: string;
  mode: ClassicMode;
  map: string;
  mapImage: string;
  startTime: Date;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  registeredPlayers: number;
  server: string;
}

export const classicTournaments: ClassicTournament[] = [
  {
    id: 'ct1',
    mode: 'solo',
    map: 'Erangel',
    mapImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    startTime: new Date(Date.now() + 1000 * 60 * 45),
    entryFee: 5,
    prizePool: 250,
    maxPlayers: 100,
    registeredPlayers: 67,
    server: 'europe',
  },
  {
    id: 'ct2',
    mode: 'duo',
    map: 'Miramar',
    mapImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400',
    startTime: new Date(Date.now() + 1000 * 60 * 90),
    entryFee: 10,
    prizePool: 500,
    maxPlayers: 50,
    registeredPlayers: 34,
    server: 'europe',
  },
  {
    id: 'ct3',
    mode: 'squad',
    map: 'Sanhok',
    mapImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    startTime: new Date(Date.now() + 1000 * 60 * 120),
    entryFee: 20,
    prizePool: 1000,
    maxPlayers: 25,
    registeredPlayers: 18,
    server: 'asia',
  },
  {
    id: 'ct4',
    mode: 'solo',
    map: 'Vikendi',
    mapImage: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400',
    startTime: new Date(Date.now() + 1000 * 60 * 180),
    entryFee: 3,
    prizePool: 150,
    maxPlayers: 100,
    registeredPlayers: 45,
    server: 'na',
  },
  {
    id: 'ct5',
    mode: 'duo',
    map: 'Livik',
    mapImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400',
    startTime: new Date(Date.now() + 1000 * 60 * 30),
    entryFee: 7,
    prizePool: 350,
    maxPlayers: 50,
    registeredPlayers: 42,
    server: 'europe',
  },
];

export const classicLeaders: TournamentLeader[] = [
  { rank: 1, id: 'cl1', username: 'ClassicKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ClassicKing', wins: 89, earnings: 4200 },
  { rank: 2, id: 'cl2', username: 'ChickenDinner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chicken', wins: 76, earnings: 3800 },
  { rank: 3, id: 'cl3', username: 'SurvivalPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Survival', wins: 68, earnings: 3200 },
  { rank: 4, id: 'cl4', username: 'ZoneMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zone', wins: 61, earnings: 2900 },
  { rank: 5, id: 'cl5', username: 'LootGoblin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Loot', wins: 55, earnings: 2600 },
  { rank: 6, id: 'cl6', username: 'CamperKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camper', wins: 49, earnings: 2300 },
  { rank: 7, id: 'cl7', username: 'DropHot', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Drop', wins: 44, earnings: 2100 },
  { rank: 8, id: 'cl8', username: 'CircleRunner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Circle', wins: 40, earnings: 1900 },
  { rank: 9, id: 'cl9', username: 'FinalZone', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Final', wins: 36, earnings: 1700 },
  { rank: 10, id: 'cl10', username: 'AirdropHunter', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Airdrop', wins: 33, earnings: 1500 },
  { rank: 11, id: 'cl11', username: 'SnakePlayer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Snake', wins: 30, earnings: 1350 },
  { rank: 12, id: 'cl12', username: 'VehicleKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vehicle', wins: 27, earnings: 1200 },
  { rank: 13, id: 'cl13', username: 'BridgeCamper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bridge', wins: 25, earnings: 1100 },
  { rank: 14, id: 'cl14', username: 'CompoundKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Compound', wins: 23, earnings: 1000 },
  { rank: 15, id: 'cl15', username: 'EdgeRunner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Edge', wins: 21, earnings: 900 },
  { rank: 16, id: 'cl16', username: 'ThirdParty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Third', wins: 19, earnings: 820 },
  { rank: 17, id: 'cl17', username: 'GhillieSuit', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghillie', wins: 17, earnings: 750 },
  { rank: 18, id: 'cl18', username: 'PanWarrior', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pan', wins: 15, earnings: 680 },
  { rank: 19, id: 'cl19', username: 'ReviverPro', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reviver', wins: 14, earnings: 620 },
  { rank: 20, id: 'cl20', username: 'LastAlive', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Last', wins: 12, earnings: 560 },
];
