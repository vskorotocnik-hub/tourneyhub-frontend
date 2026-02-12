// Типы для глобальных турниров
export type TournamentStatus = 'registration' | 'upcoming' | 'checkin' | 'live' | 'finished';
export type TournamentFormat = 'solo' | 'duo' | 'squad';
export type TournamentStage = 'registration' | 'qualifiers' | 'playoffs' | 'final';
export type TournamentGameMode = 'classic' | 'tdm' | 'wow';

export interface GlobalTournament {
  id: string;
  name: string;
  subtitle: string;
  gameMode: TournamentGameMode;
  status: TournamentStatus;
  format: TournamentFormat;
  stage: TournamentStage;
  prizePool: number;
  entryFee: number;
  commission: number;
  participants: {
    current: number;
    max: number;
  };
  dates: {
    registrationStart: string;
    registrationEnd: string;
    checkInStart: string;
    checkInEnd: string;
    tournamentStart: string;
    tournamentEnd: string;
  };
  region: string;
  server: string;
  minLevel: number;
  minRank: string;
  streamUrl?: string;
  bannerImage: string;
  description: string;
  rules: string[];
  stages: {
    name: string;
    date: string;
    status: 'upcoming' | 'live' | 'completed';
  }[];
  prizes: {
    place: string;
    amount: number;
    icon: string;
  }[];
}

// Чемпионы по режимам
export interface ModeChampion {
  id: string;
  gameMode: TournamentGameMode;
  format: TournamentFormat;
  modeName: string;
  year: number;
  place: number;
  champion: {
    name: string;
    odId: string;
    avatar: string;
    avatarUrl: string;
    country: string;
  };
  teamMembers?: string[];
  prizeWon: number;
  kills: number;
  winRate: string;
  points: number;
}

export interface TournamentTeam {
  id: string;
  name: string;
  tag: string;
  logo: string;
  captain: string;
  members: string[];
  points: number;
  wins: number;
  kills: number;
  position: number;
  isCheckedIn: boolean;
}

export interface TournamentMatch {
  id: string;
  stage: TournamentStage;
  round: number;
  matchNumber: number;
  teamA: { id: string; name: string; logo: string; score?: number } | null;
  teamB: { id: string; name: string; logo: string; score?: number } | null;
  scheduledTime: string;
  status: 'upcoming' | 'live' | 'finished';
  winner?: string;
  map: string;
}

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  stage: TournamentStage;
  title: string;
  description: string;
  isLive: boolean;
}

// Чемпионы по режимам (прошлые победители) — ТОП-4 для каждого режима/формата
export const modeChampions: ModeChampion[] = [
  // ── Classic Squad TOP-4 ──
  { id: 'cs-1', gameMode: 'classic', format: 'squad', modeName: 'Классик Сквад', year: 2025, place: 1,
    champion: { name: 'Nova Esports', odId: '9182736450', avatar: '🔷', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', country: '🇰🇷' },
    teamMembers: ['NovaAce', 'NovaStorm', 'NovaBlaze'], prizeWon: 200000, kills: 156, winRate: '72%', points: 312 },
  { id: 'cs-2', gameMode: 'classic', format: 'squad', modeName: 'Классик Сквад', year: 2025, place: 2,
    champion: { name: 'Four Angry Men', odId: '4820193756', avatar: '😠', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', country: '🇨🇳' },
    teamMembers: ['4AMFury', '4AMRage', '4AMWrath'], prizeWon: 100000, kills: 142, winRate: '68%', points: 287 },
  { id: 'cs-3', gameMode: 'classic', format: 'squad', modeName: 'Классик Сквад', year: 2025, place: 3,
    champion: { name: 'Team Secret', odId: '7361940285', avatar: '🤫', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', country: '🇲🇾' },
    teamMembers: ['SecretAgent', 'SecretSpy', 'SecretNinja'], prizeWon: 60000, kills: 128, winRate: '64%', points: 254 },
  { id: 'cs-4', gameMode: 'classic', format: 'squad', modeName: 'Классик Сквад', year: 2025, place: 4,
    champion: { name: 'Bigetron RA', odId: '5193827460', avatar: '🤖', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', country: '🇮🇩' },
    teamMembers: ['BTRLuxxy', 'BTRRyzen', 'BTRMicroboy'], prizeWon: 40000, kills: 115, winRate: '61%', points: 231 },

  // ── Classic Duo TOP-4 ──
  { id: 'cd-1', gameMode: 'classic', format: 'duo', modeName: 'Классик Дуо', year: 2025, place: 1,
    champion: { name: 'ShadowStrike', odId: '5847362910', avatar: '⚡', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop', country: '🇩🇪' },
    teamMembers: ['NightHawk'], prizeWon: 60000, kills: 47, winRate: '68%', points: 198 },
  { id: 'cd-2', gameMode: 'classic', format: 'duo', modeName: 'Классик Дуо', year: 2025, place: 2,
    champion: { name: 'PhantomX', odId: '6394817250', avatar: '👻', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', country: '🇹🇷' },
    teamMembers: ['VortexZ'], prizeWon: 35000, kills: 41, winRate: '62%', points: 176 },
  { id: 'cd-3', gameMode: 'classic', format: 'duo', modeName: 'Классик Дуо', year: 2025, place: 3,
    champion: { name: 'IceWolf', odId: '8271649305', avatar: '�', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', country: '🇷🇺' },
    teamMembers: ['FireFox'], prizeWon: 20000, kills: 38, winRate: '59%', points: 152 },
  { id: 'cd-4', gameMode: 'classic', format: 'duo', modeName: 'Классик Дуо', year: 2025, place: 4,
    champion: { name: 'DragonEye', odId: '1948372650', avatar: '🐉', avatarUrl: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&h=150&fit=crop', country: '🇻🇳' },
    teamMembers: ['TigerClaw'], prizeWon: 15000, kills: 34, winRate: '55%', points: 139 },

  // ── TDM Solo TOP-4 ──
  { id: 'ts-1', gameMode: 'tdm', format: 'solo', modeName: 'ТДМ Соло', year: 2025, place: 1,
    champion: { name: 'AimGod', odId: '3746582910', avatar: '🎯', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', country: '🇧🇷' },
    prizeWon: 30000, kills: 312, winRate: '89%', points: 420 },
  { id: 'ts-2', gameMode: 'tdm', format: 'solo', modeName: 'ТДМ Соло', year: 2025, place: 2,
    champion: { name: 'HeadshotKing', odId: '9183746250', avatar: '💀', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', country: '🇮🇳' },
    prizeWon: 18000, kills: 287, winRate: '84%', points: 385 },
  { id: 'ts-3', gameMode: 'tdm', format: 'solo', modeName: 'ТДМ Соло', year: 2025, place: 3,
    champion: { name: 'RapidFire', odId: '6281940375', avatar: '🔥', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', country: '🇵🇰' },
    prizeWon: 10000, kills: 264, winRate: '79%', points: 351 },
  { id: 'ts-4', gameMode: 'tdm', format: 'solo', modeName: 'ТДМ Соло', year: 2025, place: 4,
    champion: { name: 'ColdSniper', odId: '4927361805', avatar: '❄️', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', country: '🇯🇵' },
    prizeWon: 7000, kills: 241, winRate: '75%', points: 328 },

  // ── TDM Duo TOP-4 ──
  { id: 'td-1', gameMode: 'tdm', format: 'duo', modeName: 'ТДМ Дуо', year: 2025, place: 1,
    champion: { name: 'Blaze', odId: '6291048573', avatar: '🔥', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', country: '🇺🇸' },
    teamMembers: ['Frost'], prizeWon: 40000, kills: 198, winRate: '81%', points: 356 },
  { id: 'td-2', gameMode: 'tdm', format: 'duo', modeName: 'ТДМ Дуо', year: 2025, place: 2,
    champion: { name: 'ThunderBolt', odId: '8374016295', avatar: '⚡', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', country: '🇸🇦' },
    teamMembers: ['StormBreaker'], prizeWon: 25000, kills: 176, winRate: '76%', points: 312 },
  { id: 'td-3', gameMode: 'tdm', format: 'duo', modeName: 'ТДМ Дуо', year: 2025, place: 3,
    champion: { name: 'NeonBlade', odId: '2750183946', avatar: '⚔️', avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', country: '🇹🇭' },
    teamMembers: ['DarkEdge'], prizeWon: 15000, kills: 158, winRate: '71%', points: 283 },
  { id: 'td-4', gameMode: 'tdm', format: 'duo', modeName: 'ТДМ Дуо', year: 2025, place: 4,
    champion: { name: 'GhostRider', odId: '5948271360', avatar: '👻', avatarUrl: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=150&h=150&fit=crop', country: '��' },
    teamMembers: ['SoulReaper'], prizeWon: 10000, kills: 142, winRate: '67%', points: 259 },
];

// Mock данные - 5 ежегодных турниров по режимам
export const globalTournaments: GlobalTournament[] = [
  // Classic Duo - ежегодный турнир
  {
    id: 'classic-duo-2026',
    name: 'Классик Дуо — Чемпионат 2026',
    subtitle: 'Ежегодный турнир дуэтов',
    gameMode: 'classic',
    status: 'registration',
    format: 'duo',
    stage: 'registration',
    prizePool: 150000,
    entryFee: 25,
    commission: 2.5,
    participants: { current: 156, max: 256 },
    dates: {
      registrationStart: '2026-01-15T00:00:00Z',
      registrationEnd: '2026-02-15T23:59:59Z',
      checkInStart: '2026-02-20T10:00:00Z',
      checkInEnd: '2026-02-20T11:30:00Z',
      tournamentStart: '2026-02-20T12:00:00Z',
      tournamentEnd: '2026-03-15T22:00:00Z',
    },
    region: 'Мировой',
    server: 'Европа',
    minLevel: 40,
    minRank: 'Crown',
    bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    description: 'Ежегодный чемпионат в режиме Классик Дуо. Найди напарника и докажи, что вы — лучший дуэт года! Карты: Erangel, Miramar, Sanhok.',
    rules: [
      'Формат: Classic Duo (2 игрока)',
      'Карты: Erangel, Miramar, Sanhok (ротация)',
      'Минимальный уровень: 40, минимальный ранг: Crown',
      'Оба участника должны пройти check-in',
      'Запрещено использование эмуляторов',
      '8 матчей квалификации, топ-64 в плей-офф',
      'Очки: 15 за победу + 1 за килл',
    ],
    stages: [
      { name: 'Регистрация', date: '15 янв — 15 фев', status: 'live' },
      { name: 'Квалификация', date: '20—28 фев', status: 'upcoming' },
      { name: 'Плей-офф', date: '5—12 мар', status: 'upcoming' },
      { name: 'Гранд-финал', date: '15 мар', status: 'upcoming' },
    ],
    prizes: [
      { place: '1st', amount: 60000, icon: '🥇' },
      { place: '2nd', amount: 35000, icon: '🥈' },
      { place: '3rd', amount: 20000, icon: '🥉' },
      { place: '4th', amount: 15000, icon: '🏅' },
      { place: '5-8th', amount: 5000, icon: '🎖️' },
    ],
  },
  // Classic Squad - ежегодный турнир (LIVE)
  {
    id: 'classic-squad-2026',
    name: 'Классик Сквад — Кубок мира 2026',
    subtitle: 'Главная командная битва года',
    gameMode: 'classic',
    status: 'live',
    format: 'squad',
    stage: 'playoffs',
    prizePool: 500000,
    entryFee: 50,
    commission: 5,
    participants: { current: 128, max: 128 },
    dates: {
      registrationStart: '2025-12-01T00:00:00Z',
      registrationEnd: '2025-12-31T23:59:59Z',
      checkInStart: '2026-01-10T10:00:00Z',
      checkInEnd: '2026-01-10T11:30:00Z',
      tournamentStart: '2026-01-10T12:00:00Z',
      tournamentEnd: '2026-02-10T22:00:00Z',
    },
    region: 'Мировой',
    server: 'Европа',
    minLevel: 50,
    minRank: 'Ace',
    streamUrl: 'https://twitch.tv/pubgmobile_esports',
    bannerImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200',
    description: 'Главный ежегодный турнир в режиме Классик Сквад! 128 лучших команд мира сражаются за полмиллиона долларов и звание чемпионов года.',
    rules: [
      'Формат: Classic Squad (4 игрока)',
      'Карты: Erangel, Miramar (финалы на Erangel)',
      'Только топ-128 команд по рейтингу',
      'Double Elimination в плей-офф',
      'Очки SUPER (официальные правила PUBG Esports)',
    ],
    stages: [
      { name: 'Регистрация', date: '1—31 дек 2025', status: 'completed' },
      { name: 'Групповой этап', date: '10—20 янв', status: 'completed' },
      { name: 'Плей-офф', date: '25 янв — 5 фев', status: 'live' },
      { name: 'Гранд-финал', date: '10 фев', status: 'upcoming' },
    ],
    prizes: [
      { place: '1st', amount: 200000, icon: '🥇' },
      { place: '2nd', amount: 100000, icon: '🥈' },
      { place: '3rd', amount: 60000, icon: '🥉' },
      { place: '4th', amount: 40000, icon: '🏅' },
      { place: '5-8th', amount: 12500, icon: '🎖️' },
      { place: '9-16th', amount: 5000, icon: '⭐' },
    ],
  },
  // TDM Solo - ежегодный турнир
  {
    id: 'tdm-solo-2026',
    name: 'ТДМ Соло — Мастера 2026',
    subtitle: 'Докажи свой индивидуальный скилл',
    gameMode: 'tdm',
    status: 'checkin',
    format: 'solo',
    stage: 'qualifiers',
    prizePool: 75000,
    entryFee: 15,
    commission: 1.5,
    participants: { current: 512, max: 512 },
    dates: {
      registrationStart: '2026-01-10T00:00:00Z',
      registrationEnd: '2026-01-24T23:59:59Z',
      checkInStart: '2026-01-25T18:00:00Z',
      checkInEnd: '2026-01-25T19:30:00Z',
      tournamentStart: '2026-01-25T20:00:00Z',
      tournamentEnd: '2026-02-15T22:00:00Z',
    },
    region: 'Мировой',
    server: 'Европа',
    minLevel: 30,
    minRank: 'Diamond',
    bannerImage: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1200',
    description: 'Ежегодный чемпионат ТДМ Соло — только ты и твой аим! 512 лучших стрелков сражаются за звание короля ТДМ.',
    rules: [
      'Формат: TDM 1v1',
      'Карта: Warehouse (все матчи)',
      'Best of 3 в квалификации, Best of 5 в плей-офф',
      'Оружие: M416 + AKM (ротация)',
      'Первый до 40 киллов побеждает в раунде',
    ],
    stages: [
      { name: 'Регистрация', date: '10—24 янв', status: 'completed' },
      { name: 'Чек-ин', date: '25 янв 18:00', status: 'live' },
      { name: 'Квалификация', date: '25 янв — 5 фев', status: 'upcoming' },
      { name: 'Плей-офф', date: '10—14 фев', status: 'upcoming' },
      { name: 'Гранд-финал', date: '15 фев', status: 'upcoming' },
    ],
    prizes: [
      { place: '1st', amount: 30000, icon: '🥇' },
      { place: '2nd', amount: 18000, icon: '🥈' },
      { place: '3rd', amount: 10000, icon: '🥉' },
      { place: '4th', amount: 7000, icon: '🏅' },
      { place: '5-8th', amount: 2500, icon: '🎖️' },
    ],
  },
  // TDM Duo - ежегодный турнир (Finished - прошлогодний)
  {
    id: 'tdm-duo-2025',
    name: 'ТДМ Дуо — Чемпионат 2025',
    subtitle: 'Лучшая огневая мощь в дуэте',
    gameMode: 'tdm',
    status: 'finished',
    format: 'duo',
    stage: 'final',
    prizePool: 100000,
    entryFee: 20,
    commission: 2,
    participants: { current: 256, max: 256 },
    dates: {
      registrationStart: '2025-10-01T00:00:00Z',
      registrationEnd: '2025-10-31T23:59:59Z',
      checkInStart: '2025-11-05T10:00:00Z',
      checkInEnd: '2025-11-05T11:30:00Z',
      tournamentStart: '2025-11-05T12:00:00Z',
      tournamentEnd: '2025-12-01T22:00:00Z',
    },
    region: 'Мировой',
    server: 'Европа',
    minLevel: 35,
    minRank: 'Diamond',
    bannerImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200',
    description: 'Ежегодный чемпионат ТДМ Дуо 2025 завершён! Победители: Blaze & Frost с невероятным счётом.',
    rules: [
      'Формат: TDM 2v2',
      'Карта: Warehouse',
      'Best of 5 во всех раундах',
      'Первая команда до 40 киллов побеждает',
    ],
    stages: [
      { name: 'Регистрация', date: '1—31 окт 2025', status: 'completed' },
      { name: 'Квалификация', date: '5—20 ноя', status: 'completed' },
      { name: 'Плей-офф', date: '22—28 ноя', status: 'completed' },
      { name: 'Гранд-финал', date: '1 дек', status: 'completed' },
    ],
    prizes: [
      { place: '1st', amount: 40000, icon: '🥇' },
      { place: '2nd', amount: 25000, icon: '🥈' },
      { place: '3rd', amount: 15000, icon: '🥉' },
      { place: '4th', amount: 10000, icon: '🏅' },
      { place: '5-8th', amount: 2500, icon: '🎖️' },
    ],
  },
  // WoW Parkour - ежегодный турнир
  {
    id: 'wow-parkour-2026',
    name: 'WoW Паркур — Кубок мира 2026',
    subtitle: 'Главный паркур-челлендж года',
    gameMode: 'wow',
    status: 'upcoming',
    format: 'solo',
    stage: 'registration',
    prizePool: 50000,
    entryFee: 10,
    commission: 1,
    participants: { current: 89, max: 256 },
    dates: {
      registrationStart: '2026-02-01T00:00:00Z',
      registrationEnd: '2026-03-01T23:59:59Z',
      checkInStart: '2026-03-05T14:00:00Z',
      checkInEnd: '2026-03-05T15:30:00Z',
      tournamentStart: '2026-03-05T16:00:00Z',
      tournamentEnd: '2026-03-20T22:00:00Z',
    },
    region: 'Мировой',
    server: 'Европа',
    minLevel: 20,
    minRank: 'Gold',
    bannerImage: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=1200',
    description: 'Ежегодный чемпионат по паркуру в режиме WoW! Скорость, точность, мастерство — покажи, что ты лучший паркурщик PUBG Mobile.',
    rules: [
      'Формат: Solo Parkour',
      'Кастомные паркур-карты WoW',
      'Время прохождения — главный критерий',
      'Штраф за падение: +5 секунд',
      'Топ-32 по времени проходят в финал',
    ],
    stages: [
      { name: 'Регистрация', date: '1 фев — 1 мар', status: 'upcoming' },
      { name: 'Отборочные заезды', date: '5—15 мар', status: 'upcoming' },
      { name: 'Финалы', date: '20 мар', status: 'upcoming' },
    ],
    prizes: [
      { place: '1st', amount: 20000, icon: '🥇' },
      { place: '2nd', amount: 12000, icon: '🥈' },
      { place: '3rd', amount: 8000, icon: '🥉' },
      { place: '4-10th', amount: 1000, icon: '🏅' },
    ],
  },
];

// Mock команды для турнира
export const mockTeams: TournamentTeam[] = [
  { id: 't1', name: 'Nova Esports', tag: 'NOVA', logo: '🔷', captain: 'NovaKing', members: ['NovaKing', 'NovaAce', 'NovaStorm', 'NovaBlaze'], points: 156, wins: 8, kills: 89, position: 1, isCheckedIn: true },
  { id: 't2', name: 'Four Angry Men', tag: '4AM', logo: '😠', captain: '4AMGod', members: ['4AMGod', '4AMFury', '4AMRage', '4AMWrath'], points: 142, wins: 7, kills: 76, position: 2, isCheckedIn: true },
  { id: 't3', name: 'Team Secret', tag: 'TS', logo: '🤫', captain: 'SecretBoss', members: ['SecretBoss', 'SecretAgent', 'SecretSpy', 'SecretNinja'], points: 138, wins: 6, kills: 82, position: 3, isCheckedIn: true },
  { id: 't4', name: 'Bigetron RA', tag: 'BTR', logo: '🤖', captain: 'BTRZuxxy', members: ['BTRZuxxy', 'BTRLuxxy', 'BTRRyzen', 'BTRMicroboy'], points: 125, wins: 5, kills: 71, position: 4, isCheckedIn: true },
  { id: 't5', name: 'RRQ Athena', tag: 'RRQ', logo: '⚡', captain: 'RRQLemon', members: ['RRQLemon', 'RRQDaniel', 'RRQMortez', 'RRQPaul'], points: 118, wins: 5, kills: 65, position: 5, isCheckedIn: false },
  { id: 't6', name: 'Natus Vincere', tag: 'NAVI', logo: '💛', captain: 'NAVIAce', members: ['NAVIAce', 'NAVIBlade', 'NAVICold', 'NAVIDark'], points: 112, wins: 4, kills: 68, position: 6, isCheckedIn: true },
  { id: 't7', name: 'FaZe Clan', tag: 'FAZE', logo: '🔴', captain: 'FaZeRain', members: ['FaZeRain', 'FaZeApex', 'FaZeJev', 'FaZeKay'], points: 105, wins: 4, kills: 59, position: 7, isCheckedIn: true },
  { id: 't8', name: 'Cloud9', tag: 'C9', logo: '☁️', captain: 'C9Sniper', members: ['C9Sniper', 'C9Rusher', 'C9Medic', 'C9Scout'], points: 98, wins: 3, kills: 62, position: 8, isCheckedIn: false },
  { id: 't9', name: 'Gen.G Esports', tag: 'GEN', logo: '🐯', captain: 'GenGTiger', members: ['GenGTiger', 'GenGLion', 'GenGBear', 'GenGWolf'], points: 94, wins: 3, kills: 55, position: 9, isCheckedIn: true },
  { id: 't10', name: 'T1 Esports', tag: 'T1', logo: '🏆', captain: 'T1Faker', members: ['T1Faker', 'T1Teddy', 'T1Zeus', 'T1Keria'], points: 89, wins: 3, kills: 51, position: 10, isCheckedIn: true },
  { id: 't11', name: 'EVOS Legends', tag: 'EVOS', logo: '🦁', captain: 'EVOSKing', members: ['EVOSKing', 'EVOSPrime', 'EVOSHero', 'EVOSStar'], points: 85, wins: 2, kills: 48, position: 11, isCheckedIn: true },
  { id: 't12', name: 'Fnatic', tag: 'FNC', logo: '🧡', captain: 'FNCScout', members: ['FNCScout', 'FNCViper', 'FNCHawk', 'FNCEagle'], points: 80, wins: 2, kills: 45, position: 12, isCheckedIn: false },
];

// Mock матчи
export const mockMatches: TournamentMatch[] = [
  // Qualifiers
  { id: 'm1', stage: 'qualifiers', round: 1, matchNumber: 1, teamA: { id: 't1', name: 'Nova Esports', logo: '🔷', score: 15 }, teamB: { id: 't12', name: 'Fnatic', logo: '🧡', score: 8 }, scheduledTime: '2026-01-20T10:00:00Z', status: 'finished', winner: 't1', map: 'Erangel' },
  { id: 'm2', stage: 'qualifiers', round: 1, matchNumber: 2, teamA: { id: 't2', name: 'Four Angry Men', logo: '😠', score: 18 }, teamB: { id: 't11', name: 'EVOS Legends', logo: '🦁', score: 12 }, scheduledTime: '2026-01-20T11:00:00Z', status: 'finished', winner: 't2', map: 'Miramar' },
  { id: 'm3', stage: 'qualifiers', round: 1, matchNumber: 3, teamA: { id: 't3', name: 'Team Secret', logo: '🤫', score: 14 }, teamB: { id: 't10', name: 'T1 Esports', logo: '🏆', score: 10 }, scheduledTime: '2026-01-20T12:00:00Z', status: 'finished', winner: 't3', map: 'Sanhok' },
  { id: 'm4', stage: 'qualifiers', round: 1, matchNumber: 4, teamA: { id: 't4', name: 'Bigetron RA', logo: '🤖', score: 16 }, teamB: { id: 't9', name: 'Gen.G Esports', logo: '🐯', score: 11 }, scheduledTime: '2026-01-20T13:00:00Z', status: 'finished', winner: 't4', map: 'Vikendi' },
  // Playoffs
  { id: 'm5', stage: 'playoffs', round: 1, matchNumber: 1, teamA: { id: 't1', name: 'Nova Esports', logo: '🔷', score: 22 }, teamB: { id: 't4', name: 'Bigetron RA', logo: '🤖', score: 18 }, scheduledTime: '2026-01-24T14:00:00Z', status: 'finished', winner: 't1', map: 'Erangel' },
  { id: 'm6', stage: 'playoffs', round: 1, matchNumber: 2, teamA: { id: 't2', name: 'Four Angry Men', logo: '😠', score: 20 }, teamB: { id: 't3', name: 'Team Secret', logo: '🤫', score: 19 }, scheduledTime: '2026-01-24T15:00:00Z', status: 'finished', winner: 't2', map: 'Miramar' },
  { id: 'm7', stage: 'playoffs', round: 2, matchNumber: 1, teamA: { id: 't1', name: 'Nova Esports', logo: '🔷' }, teamB: { id: 't2', name: 'Four Angry Men', logo: '😠' }, scheduledTime: '2026-01-25T16:00:00Z', status: 'live', map: 'Erangel' },
  // Final
  { id: 'm8', stage: 'final', round: 1, matchNumber: 1, teamA: null, teamB: null, scheduledTime: '2026-01-26T18:00:00Z', status: 'upcoming', map: 'Erangel' },
];

// Mock расписание
export const mockSchedule: ScheduleEvent[] = [
  { id: 's1', date: '20 Jan', time: '10:00', stage: 'qualifiers', title: 'Qualifiers Day 1', description: 'Матчи 1-4 квалификации', isLive: false },
  { id: 's2', date: '21 Jan', time: '10:00', stage: 'qualifiers', title: 'Qualifiers Day 2', description: 'Матчи 5-8 квалификации', isLive: false },
  { id: 's3', date: '22 Jan', time: '10:00', stage: 'qualifiers', title: 'Qualifiers Day 3', description: 'Матчи 9-12 квалификации', isLive: false },
  { id: 's4', date: '24 Jan', time: '14:00', stage: 'playoffs', title: 'Playoffs Round 1', description: 'Полуфиналы плей-офф', isLive: false },
  { id: 's5', date: '25 Jan', time: '16:00', stage: 'playoffs', title: 'Playoffs Round 2', description: 'Финал плей-офф', isLive: true },
  { id: 's6', date: '26 Jan', time: '18:00', stage: 'final', title: 'Grand Final', description: 'Финальные матчи за чемпионство', isLive: false },
];

// Хелпер для получения турнира по ID
export const getTournamentById = (id: string): GlobalTournament | undefined => {
  return globalTournaments.find(t => t.id === id);
};

// Хелпер для фильтрации турниров
export const filterTournaments = (
  tournaments: GlobalTournament[],
  status?: TournamentStatus,
  format?: TournamentFormat,
  search?: string
): GlobalTournament[] => {
  return tournaments.filter(t => {
    if (status && t.status !== status) return false;
    if (format && t.format !== format) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
};
