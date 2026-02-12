import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import StarRating from '../components/StarRating';

// Types
interface Account {
  id: string;
  image: string;
  description: string;
  collectionLevel: number;
  price: number;
  includes: string[];
  sellerRating: number;
  sellerReviews: number;
}

interface Popularity {
  id: string;
  image: string;
  type: string;
  typeIcon: string;
  amountMin: number;
  amountMax: number;
  price: number;
  pricePerThousand: number;
  availableFrom: string;
  availableTo: string;
  sellerRating: number;
  sellerReviews: number;
}

interface MetroItem {
  id: string;
  images: string[];
  name: string;
  type: string;
  price: number;
  description: string;
  sellerRating: number;
  sellerReviews: number;
}

interface Clan {
  id: string;
  image: string;
  name: string;
  level: number;
  description: string;
  price: number;
  sellerRating: number;
  sellerReviews: number;
}

interface HomeVotes {
  id: string;
  image: string;
  amountMin: number;
  amountMax: number;
  price: number;
  pricePer100: number;
  description: string;
  sellerRating: number;
  sellerReviews: number;
}

interface Costume {
  id: string;
  image: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  sellerRating: number;
  sellerReviews: number;
}

interface Car {
  id: string;
  image: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  sellerRating: number;
  sellerReviews: number;
}

// Tabs
const tabs = [
  { id: 'accounts', name: 'Аккаунты', icon: '👤' },
  { id: 'costumes', name: 'Костюмы', icon: '👔' },
  { id: 'cars', name: 'Машины', icon: '🚗' },
  { id: 'metro', name: 'Метро Рояль', icon: '🚇' },
  { id: 'popularity', name: 'Популярность', icon: '⭐' },
  { id: 'home-votes', name: 'Голоса дома', icon: '🏠' },
  { id: 'clan', name: 'Клан', icon: '🛡️' },
];

// Banners
const banners = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    title: 'Аккаунты PUBG Mobile',
    subtitle: 'Покупка и продажа аккаунтов',
    gradient: 'from-blue-900/80 to-transparent',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
    title: 'Metro Royale',
    subtitle: 'Предметы без входа в аккаунт',
    gradient: 'from-emerald-900/80 to-transparent',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    title: 'Популярность',
    subtitle: 'Машинки, самолёты и другие типы',
    gradient: 'from-purple-900/80 to-transparent',
  },
];

// Popularity types in PUBG Mobile
const popularityTypes = [
  { id: 'cars', name: 'Машинки', icon: '🚗' },
  { id: 'planes', name: 'Самолёты', icon: '✈️' },
  { id: 'hearts', name: 'Сердечки', icon: '❤️' },
  { id: 'flowers', name: 'Цветы', icon: '🌸' },
  { id: 'bears', name: 'Мишки', icon: '🧸' },
  { id: 'diamonds', name: 'Алмазы', icon: '💎' },
];

// Metro item types
const metroItemTypes = [
  { id: 'weapon-sets', name: 'Комплекты оружия' },
  { id: 'armor', name: 'Броня' },
  { id: 'attachments', name: 'Обвесы' },
  { id: 'consumables', name: 'Расходники' },
  { id: 'letters', name: 'Письма' },
  { id: 'backpacks', name: 'Рюкзаки' },
  { id: 'other', name: 'Другое' },
];

// Detailed account data (for bottom sheet)
interface AccountItem {
  name: string;
  rarity: string;
}

interface AccountDetail {
  images: string[];
  price: number;
  collectionLevel: number;
  rpSeasons: string[][];
  rareCostumes: AccountItem[];
  vehicleSkins: AccountItem[];
  weaponSkins: AccountItem[];
  otherItems: AccountItem[];
  reviewLink?: string;
}

// Real PUBG Mobile account YouTube video IDs for thumbnails
const pubgAccVideoIds = [
  'kua-0AJCiVA','-vhVNIcUsvI','24tmpuzYgqA','ZL0aQZ_vf-0','wf55zscec1M',
  'nMAXezrLkjU','MLThvqQ8tH4','FyTnqV0-86c','oDJcheVqgQA','44NtbpCz424',
  'uwxHTnnxdXI','O5KmBSSJbiE','tB6evNy_Z8Q','uhTJRadK6Xg','0f-1cDtbbig',
  '1Ktdc3lh99k','kua-0AJCiVA','-vhVNIcUsvI','24tmpuzYgqA','ZL0aQZ_vf-0',
  'wf55zscec1M','nMAXezrLkjU','MLThvqQ8tH4','FyTnqV0-86c','oDJcheVqgQA',
  '44NtbpCz424','uwxHTnnxdXI','O5KmBSSJbiE','tB6evNy_Z8Q','uhTJRadK6Xg',
];
const pubgAccVideoIds2 = [
  'MLThvqQ8tH4','FyTnqV0-86c','oDJcheVqgQA','44NtbpCz424','uwxHTnnxdXI',
  'O5KmBSSJbiE','tB6evNy_Z8Q','uhTJRadK6Xg','0f-1cDtbbig','1Ktdc3lh99k',
  'kua-0AJCiVA','-vhVNIcUsvI','24tmpuzYgqA','ZL0aQZ_vf-0','wf55zscec1M',
  'nMAXezrLkjU','MLThvqQ8tH4','FyTnqV0-86c','oDJcheVqgQA','44NtbpCz424',
  'uwxHTnnxdXI','O5KmBSSJbiE','tB6evNy_Z8Q','uhTJRadK6Xg','0f-1cDtbbig',
  '1Ktdc3lh99k','kua-0AJCiVA','-vhVNIcUsvI','24tmpuzYgqA','ZL0aQZ_vf-0',
];
const pubgAccVideoIds3 = [
  '0f-1cDtbbig','1Ktdc3lh99k','nMAXezrLkjU','kua-0AJCiVA','-vhVNIcUsvI',
  '24tmpuzYgqA','ZL0aQZ_vf-0','wf55zscec1M','MLThvqQ8tH4','FyTnqV0-86c',
  'oDJcheVqgQA','44NtbpCz424','uwxHTnnxdXI','O5KmBSSJbiE','tB6evNy_Z8Q',
  'uhTJRadK6Xg','0f-1cDtbbig','1Ktdc3lh99k','nMAXezrLkjU','kua-0AJCiVA',
  '-vhVNIcUsvI','24tmpuzYgqA','ZL0aQZ_vf-0','wf55zscec1M','MLThvqQ8tH4',
  'FyTnqV0-86c','oDJcheVqgQA','44NtbpCz424','uwxHTnnxdXI','O5KmBSSJbiE',
];

const accountDetails: Record<string, AccountDetail> = Object.fromEntries(
  Array.from({ length: 30 }, (_, i) => {
    const id = String(i + 1);
    const imgs = [
      `https://img.youtube.com/vi/${pubgAccVideoIds[i]}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${pubgAccVideoIds2[i]}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${pubgAccVideoIds3[i]}/hqdefault.jpg`,
    ];
    const allCostumes: AccountItem[] = [
      { name: 'Glacier Suit', rarity: 'Mythic' }, { name: 'Pharaoh X-Suit', rarity: 'Mythic' },
      { name: 'Poseidon X-Suit', rarity: 'Mythic' }, { name: 'Blood Raven Set', rarity: 'Legendary' },
      { name: 'Dragon Hunter Set', rarity: 'Legendary' }, { name: 'Mummy Set', rarity: 'Legendary' },
      { name: 'Arctic Fox Set', rarity: 'Epic' }, { name: 'Samurai Ops Set', rarity: 'Epic' },
      { name: 'Avalanche Set', rarity: 'Epic' }, { name: 'Night Terror Set', rarity: 'Epic' },
      { name: 'Roaring Dragon Set', rarity: 'Rare' }, { name: 'Supply Captain Set', rarity: 'Rare' },
    ];
    const allVehicles: AccountItem[] = [
      { name: 'McLaren 570S', rarity: 'Mythic' }, { name: 'Lamborghini Open Top', rarity: 'Mythic' },
      { name: 'Dacia Golden', rarity: 'Epic' }, { name: 'UAZ Neon Glow', rarity: 'Epic' },
      { name: 'Buggy Flames', rarity: 'Rare' }, { name: 'Motorcycle Fury', rarity: 'Rare' },
    ];
    const allWeapons: AccountItem[] = [
      { name: 'M416 Glacier', rarity: 'Mythic' }, { name: 'AWM Dragon Lore', rarity: 'Mythic' },
      { name: 'AKM Hellfire', rarity: 'Legendary' }, { name: 'Kar98k Fool', rarity: 'Legendary' },
      { name: 'M762 Rugged Beige', rarity: 'Epic' }, { name: 'UZI Neon Punk', rarity: 'Epic' },
      { name: 'Groza Treasure', rarity: 'Epic' }, { name: 'DP-28 Frostbite', rarity: 'Rare' },
    ];
    const allOther: AccountItem[] = [
      { name: 'Golden Wings Parachute', rarity: 'Legendary' }, { name: 'Neon Glow Backpack', rarity: 'Epic' },
      { name: 'Pan Kill Message', rarity: 'Rare' }, { name: 'Samurai Helmet', rarity: 'Epic' },
    ];
    const rpAll = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15','S16','S17','S18','S19','S20','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14'];
    const lvl = [8,12,15,18,22,25,28,30,32,35,38,40,42,45,48,50,52,55,58,60,62,65,68,70,72,75,78,80,82,85][i];
    const price = [15,25,35,40,55,70,85,95,110,130,150,170,190,210,230,250,270,290,310,340,370,400,430,460,500,550,600,680,750,900][i];
    const rpCount = Math.min(3 + Math.floor(i * 1.1), rpAll.length);
    return [id, {
      images: imgs,
      price,
      collectionLevel: lvl,
      rpSeasons: [rpAll.slice(0, rpCount)],
      rareCostumes: allCostumes.slice(0, Math.min(1 + Math.floor(i / 3), allCostumes.length)),
      vehicleSkins: allVehicles.slice(0, Math.min(1 + Math.floor(i / 5), allVehicles.length)),
      weaponSkins: allWeapons.slice(0, Math.min(1 + Math.floor(i / 4), allWeapons.length)),
      otherItems: allOther.slice(0, Math.min(1 + Math.floor(i / 7), allOther.length)),
      ...(i % 3 === 0 ? { reviewLink: `https://www.tiktok.com/@pubg_review/video/${1000000 + i}` } : {}),
    }];
  })
);

// Mock data
const accDescriptions = [
  'Стартовый аккаунт', 'Базовый аккаунт с RP', 'Аккаунт новичка+', 'Аккаунт с бонусами',
  'Прокачанный аккаунт', 'Аккаунт с редкими скинами', 'Средний аккаунт', 'Хороший аккаунт с Metro',
  'Аккаунт с Conqueror рамкой', 'Премиум аккаунт', 'Аккаунт коллекционера', 'Аккаунт с Glacier M416',
  'Pro аккаунт', 'Аккаунт с X-Suit', 'Топовый аккаунт', 'Аккаунт с Mythic скинами',
  'Полный аккаунт с RP', 'Аккаунт Ace Master', 'Аккаунт с титулами', 'Mega аккаунт',
  'Элитный аккаунт', 'Аккаунт с McLaren', 'Аккаунт с Lamborghini', 'VIP аккаунт',
  'Аккаунт S1 ветерана', 'Conqueror аккаунт', 'Максимальный аккаунт', 'Platinum аккаунт',
  'Diamond аккаунт', 'Легендарный аккаунт',
];
const mockAccounts: Account[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  image: `https://img.youtube.com/vi/${pubgAccVideoIds[i]}/hqdefault.jpg`,
  description: accDescriptions[i],
  collectionLevel: [8,12,15,18,22,25,28,30,32,35,38,40,42,45,48,50,52,55,58,60,62,65,68,70,72,75,78,80,82,85][i],
  price: [15,25,35,40,55,70,85,95,110,130,150,170,190,210,230,250,270,290,310,340,370,400,430,460,500,550,600,680,750,900][i],
  includes: i < 5 ? ['RP последних сезонов', 'Базовые скины'] :
    i < 15 ? ['RP S9-S20', 'Редкие костюмы', 'Glacier M416'] :
    i < 25 ? ['Все RP', 'Mythic скины', 'Популярность 5M+'] :
    ['Все RP S1-A14', 'Все Mythic скины', 'McLaren/Lamborghini', 'Conqueror титулы'],
  sellerRating: +(3.8 + (i % 13) * 0.1).toFixed(1),
  sellerReviews: 5 + i * 7 + (i % 5) * 13,
}));

const popTypes = [
  { type: 'Машинки', icon: '🚗' }, { type: 'Самолёты', icon: '✈️' }, { type: 'Сердечки', icon: '❤️' },
  { type: 'Цветы', icon: '🌸' }, { type: 'Мишки', icon: '🧸' }, { type: 'Алмазы', icon: '💎' },
];
const mockPopularity: Popularity[] = Array.from({ length: 30 }, (_, i) => {
  const t = popTypes[i % 6];
  const base = 10000 + i * 5000;
  return {
    id: String(i + 1), image: `https://picsum.photos/seed/pop${i + 1}/400/300`,
    type: t.type, typeIcon: t.icon,
    amountMin: base, amountMax: base + 20000 + i * 2000,
    price: Math.round((base + 10000) * 0.0005 + i * 2),
    pricePerThousand: +(0.35 + (i % 8) * 0.05).toFixed(2),
    availableFrom: `${8 + (i % 6)}:00`, availableTo: `${20 + (i % 4)}:00`,
    sellerRating: +(4.0 + (i % 10) * 0.1).toFixed(1),
    sellerReviews: 10 + i * 5 + (i % 7) * 8,
  };
});

const metroNames: [string, string, number, string][] = [
  ['M416 Полный комплект', 'weapon-sets', 15, 'Тактический обвес + глушитель для M416'],
  ['AKM Обвес комплект', 'weapon-sets', 12, 'Полный обвес для AKM: компенсатор, цевьё, магазин'],
  ['Groza + обвес', 'weapon-sets', 18, 'Groza с полным обвесом для Metro Royale'],
  ['AWM Комплект снайпера', 'weapon-sets', 22, 'AWM + глушитель + прицел 8x + сошки'],
  ['M249 Тяжёлый комплект', 'weapon-sets', 20, 'M249 с расширенным магазином и прицелом'],
  ['Броня 3 уровня', 'armor', 8, 'Полный сет: шлем 3 ур., жилет 3 ур., рюкзак'],
  ['Броня 2 уровня', 'armor', 5, 'Шлем 2 ур. + жилет 2 ур.'],
  ['Шлем 3 уровня x3', 'armor', 6, 'Три шлема 3 уровня для команды'],
  ['Жилет 3 уровня x3', 'armor', 7, 'Три жилета 3 уровня для команды'],
  ['Тактический жилет', 'armor', 10, 'Улучшенный жилет с доп. слотами'],
  ['Расширенный магазин AR', 'attachments', 3, 'Расширенный магазин для штурмовых винтовок'],
  ['Компенсатор AR', 'attachments', 3, 'Компенсатор для штурмовых винтовок'],
  ['Прицел 6x', 'attachments', 4, 'Прицел с увеличением 6x для снайперских винтовок'],
  ['Прицел 8x', 'attachments', 5, 'Прицел с увеличением 8x'],
  ['Глушитель SR', 'attachments', 4, 'Глушитель для снайперских винтовок'],
  ['Аптечки x10', 'consumables', 5, 'Набор из 10 аптечек первой помощи'],
  ['Аптечки x20', 'consumables', 9, 'Большой набор из 20 аптечек'],
  ['Бинты x50', 'consumables', 3, 'Набор из 50 бинтов для лечения'],
  ['Энергетики x15', 'consumables', 6, 'Набор энергетиков для ускорения'],
  ['Обезболивающие x15', 'consumables', 7, 'Набор обезболивающих для буста'],
  ['Письмо опыта x1', 'letters', 2, 'Письмо опыта Metro Royale +500 XP'],
  ['Письмо опыта x5', 'letters', 8, '5 писем опыта Metro Royale +2500 XP'],
  ['Письмо опыта x10', 'letters', 14, '10 писем опыта Metro Royale +5000 XP'],
  ['Редкое письмо', 'letters', 6, 'Редкое письмо с уникальным содержимым'],
  ['Золотое письмо', 'letters', 10, 'Золотое письмо с повышенным XP'],
  ['Тактический рюкзак', 'backpacks', 12, 'Тактический рюкзак +150 к инвентарю'],
  ['Рюкзак 3 уровня', 'backpacks', 8, 'Рюкзак 3 уровня +270 к инвентарю'],
  ['Рюкзак 2 уровня x3', 'backpacks', 7, 'Три рюкзака 2 уровня для команды'],
  ['Мини рюкзак набор', 'backpacks', 4, 'Набор из 5 рюкзаков 1 уровня'],
  ['Улучшенный рюкзак', 'backpacks', 15, 'Рюкзак с доп. слотами и бронёй'],
];
const mockMetroItems: MetroItem[] = metroNames.map(([name, type, price, desc], i) => ({
  id: String(i + 1),
  images: [`https://picsum.photos/seed/metro${i + 1}a/400/300`, `https://picsum.photos/seed/metro${i + 1}b/400/300`],
  name, type, price, description: desc,
  sellerRating: +(3.9 + (i % 11) * 0.1).toFixed(1),
  sellerReviews: 3 + i * 4 + (i % 6) * 9,
}));

const clanNames = [
  'Phoenix Rising','Night Warriors','Elite Squad','Shadow Wolves','Iron Legion',
  'Storm Brigade','Dragon Slayers','Frost Empire','Dark Knights','Royal Guard',
  'Thunder Hawks','Steel Titans','Blood Ravens','Neon Vipers','Arctic Foxes',
  'Fire Eagles','Ghost Reapers','Golden Lions','Crystal Wolves','Star Hunters',
  'Omega Force','Alpha Strike','Venom Squad','Chaos Legion','Solar Flare',
  'Midnight Clan','Cyber Punks','Battle Born','War Machine','Supreme Elite',
];
const clanDescs = [
  'Активный клан, ежедневные турниры','Средний клан, хорошая статистика','Топовый клан с макс. наградами',
  'Дружелюбный клан для новичков','Клан с бонусами за активность','Клан для про-игроков',
  'Клан с Metro Royale фокусом','Клан ветеранов S1','Конкурентный клан, топ-100','Клан с полным составом',
];
const mockClans: Clan[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  image: `https://picsum.photos/seed/clan${i + 1}/400/300`,
  name: clanNames[i],
  level: Math.min(1 + Math.floor(i / 3), 10),
  description: clanDescs[i % clanDescs.length],
  price: [10,15,20,25,30,40,50,60,70,80,90,100,110,120,130,140,150,170,190,210,230,250,280,310,350,400,450,500,600,750][i],
  sellerRating: +(4.1 + (i % 9) * 0.1).toFixed(1),
  sellerReviews: 8 + i * 6 + (i % 4) * 11,
}));

const votesDescs = ['Мини пакет','Базовый пакет','Стандарт пакет','Средний пакет','Выгодный пакет','Большой пакет','Расширенный пакет','Оптовый пакет','Премиум пакет','Максимальный пакет'];
const mockHomeVotes: HomeVotes[] = Array.from({ length: 30 }, (_, i) => {
  const min = 200 + i * 500;
  const max = min + 500 + i * 300;
  const per100 = +(0.55 - i * 0.005).toFixed(2);
  return {
    id: String(i + 1),
    image: `https://picsum.photos/seed/votes${i + 1}/400/300`,
    amountMin: min, amountMax: max,
    price: Math.round(max * per100 / 100),
    pricePer100: Math.max(per100, 0.2),
    description: votesDescs[i % votesDescs.length],
    sellerRating: +(3.7 + (i % 12) * 0.1).toFixed(1),
    sellerReviews: 4 + i * 3 + (i % 8) * 7,
  };
});

const costumeData: [string, number, string, string][] = [
  ['Glacier Set', 180, '10 мин', 'Ледяной сет с Mythic эффектами замораживания'],
  ['Pharaoh X-Suit', 350, '15 мин', 'Премиальный X-Suit с египетской тематикой и анимациями'],
  ['Poseidon X-Suit', 380, '15 мин', 'Морской X-Suit с водяными эффектами и трезубцем'],
  ['Blood Raven Set', 120, '10 мин', 'Полный комплект Blood Raven с тёмными эффектами'],
  ['Dragon Hunter Set', 150, '10 мин', 'Костюм охотника на драконов с огненной аурой'],
  ['Mummy Set', 95, '5 мин', 'Костюм мумии с эффектами песчаной бури'],
  ['Arctic Fox Set', 85, '5 мин', 'Зимний сет с арктической лисой и снежными эффектами'],
  ['Samurai Ops Set', 75, '5 мин', 'Тактический самурайский сет с катаной'],
  ['Avalanche Set', 110, '10 мин', 'Ледяной сет с эффектом снежной лавины'],
  ['Night Terror Set', 90, '5 мин', 'Тёмный сет с эффектами ночного кошмара'],
  ['Roaring Dragon Set', 65, '5 мин', 'Костюм дракона с рёвом и огненным хвостом'],
  ['Supply Captain Set', 55, '5 мин', 'Военный сет капитана снабжения'],
  ['Neon Punk Set', 70, '5 мин', 'Киберпанк костюм с неоновой подсветкой'],
  ['Ocean Warrior Set', 80, '5 мин', 'Морской воин с водяными эффектами'],
  ['Volcano Set', 130, '10 мин', 'Огненный костюм с лавовыми эффектами'],
  ['Shadow Assassin Set', 100, '10 мин', 'Костюм теневого убийцы с невидимостью'],
  ['Golden Pharaoh Set', 160, '10 мин', 'Золотой фараон с эффектами песка'],
  ['Frost Commander Set', 140, '10 мин', 'Ледяной командир с морозными эффектами'],
  ['Cyber Mecha Set', 200, '10 мин', 'Мех-костюм с киберпанк эффектами'],
  ['Inferno Warrior Set', 170, '10 мин', 'Огненный воин с пламенной аурой'],
  ['Sakura Set', 60, '5 мин', 'Японский сет с лепестками сакуры'],
  ['Desert Eagle Set', 45, '5 мин', 'Пустынный орёл с песчаными эффектами'],
  ['Crystal Set', 90, '5 мин', 'Кристальный сет с сияющими эффектами'],
  ['Thunder God Set', 220, '15 мин', 'Бог грома с молниями и электрическими эффектами'],
  ['Ninja Set', 50, '5 мин', 'Костюм ниндзя с дымовыми эффектами'],
  ['Space Commander Set', 250, '15 мин', 'Космический командир с голографическими эффектами'],
  ['Wolf Hunter Set', 75, '5 мин', 'Охотник на волков с мехом и когтями'],
  ['Royal Knight Set', 130, '10 мин', 'Королевский рыцарь с золотыми доспехами'],
  ['Phantom Set', 95, '5 мин', 'Призрачный сет с эффектами исчезновения'],
  ['Titan X-Suit', 400, '15 мин', 'Премиальный X-Suit титана с мощными анимациями'],
];
const mockCostumes: Costume[] = costumeData.map(([name, price, deliveryTime, description], i) => ({
  id: String(i + 1),
  image: `https://picsum.photos/seed/costume${i + 1}/400/300`,
  name, price, deliveryTime, description,
  sellerRating: +(4.0 + (i % 10) * 0.1).toFixed(1),
  sellerReviews: 6 + i * 5 + (i % 6) * 10,
}));

const carData: [string, number, string, string][] = [
  ['McLaren 570S', 180, '10 мин', 'Спортивный суперкар McLaren с уникальным оранжевым дизайном'],
  ['Lamborghini Open Top', 250, '15 мин', 'Легендарный Lamborghini с открытым верхом и неоном'],
  ['Ferrari SF90 Stradale', 320, '15 мин', 'Гибридный гиперкар Ferrari с максимальной скоростью'],
  ['Bugatti Divo', 450, '20 мин', 'Эксклюзивный гиперкар Bugatti Divo с аэродинамикой'],
  ['Porsche 911 GT3', 150, '10 мин', 'Классический спорткар Porsche 911 в гоночной ливрее'],
  ['BMW M4 Competition', 95, '5 мин', 'Немецкий спортивный седан BMW M серии'],
  ['Dacia Golden', 40, '5 мин', 'Золотая Dacia — классика PUBG Mobile'],
  ['UAZ Neon Glow', 55, '5 мин', 'UAZ с неоновой подсветкой и светящимися колёсами'],
  ['Buggy Flames', 35, '5 мин', 'Багги с огненными языками пламени'],
  ['Motorcycle Fury', 30, '5 мин', 'Мотоцикл с агрессивным дизайном и турбо'],
  ['Tesla Cybertruck', 200, '10 мин', 'Футуристический Tesla Cybertruck с бронёй'],
  ['Jeep Wrangler Military', 60, '5 мин', 'Военный Jeep Wrangler в камуфляжной раскраске'],
  ['Dacia Neon Pink', 45, '5 мин', 'Dacia с неоново-розовой подсветкой'],
  ['UAZ Arctic White', 50, '5 мин', 'Арктический UAZ в белом камуфляже'],
  ['Buggy Neon', 38, '5 мин', 'Неоновая багги с RGB подсветкой'],
  ['Motorcycle Gold', 42, '5 мин', 'Золотой мотоцикл с хромированными деталями'],
  ['Mirado Classic', 65, '5 мин', 'Классический Mirado в ретро стиле'],
  ['Mirado Neon', 70, '5 мин', 'Mirado с полной неоновой подсветкой'],
  ['Rony Camper', 25, '5 мин', 'Рони в стиле кемпера с палаткой на крыше'],
  ['Boat Speed Racer', 30, '5 мин', 'Скоростная лодка с гоночным дизайном'],
  ['Snowmobile Frost', 55, '5 мин', 'Снегоход с ледяными эффектами'],
  ['BRDM Armored Gold', 120, '10 мин', 'Золотой бронированный BRDM'],
  ['Monster Truck', 160, '10 мин', 'Монстр-трак с огромными колёсами и подсветкой'],
  ['Coupe RB Sport', 85, '5 мин', 'Спортивное купе RB с аэродинамическим обвесом'],
  ['Pickup Truck Military', 40, '5 мин', 'Военный пикап с турелью на крыше'],
  ['Tuk Tuk Golden', 20, '5 мин', 'Золотой тук-тук — редкий коллекционный скин'],
  ['Scooter Neon', 15, '5 мин', 'Неоновый скутер с LED подсветкой'],
  ['UAZ Open Top Safari', 48, '5 мин', 'Открытый UAZ в стиле сафари'],
  ['Dacia Rally Sport', 52, '5 мин', 'Dacia в ралли-ливрее с усиленной подвеской'],
  ['Helicopter Phantom', 500, '20 мин', 'Вертолёт Phantom с невидимым камуфляжем'],
];
const mockCars: Car[] = carData.map(([name, price, deliveryTime, description], i) => ({
  id: String(i + 1),
  image: `https://picsum.photos/seed/car${i + 1}/400/300`,
  name, price, deliveryTime, description,
  sellerRating: +(3.8 + (i % 12) * 0.1).toFixed(1),
  sellerReviews: 7 + i * 4 + (i % 5) * 12,
}));

const AccountsPage = () => {
  const navigate = useNavigate();
  useParams<{ gameId: string }>();
  
  // Active tab
  const [activeTab, setActiveTab] = useState('accounts');
  
  // Accounts filters
  const [accPriceFrom, setAccPriceFrom] = useState('');
  const [accPriceTo, setAccPriceTo] = useState('');
  const [accCollectionFrom, setAccCollectionFrom] = useState('');
  const [accCollectionTo, setAccCollectionTo] = useState('');
  const [accSortOrder, setAccSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showAccSortDropdown, setShowAccSortDropdown] = useState(false);
  
  // Popularity filters
  const [popAmountFrom, setPopAmountFrom] = useState('');
  const [popAmountTo, setPopAmountTo] = useState('');
  const [popPriceFrom, setPopPriceFrom] = useState('');
  const [popPriceTo, setPopPriceTo] = useState('');
  const [popSelectedTypes, setPopSelectedTypes] = useState<string[]>([]);
  const [popSortOrder, setPopSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showPopSortDropdown, setShowPopSortDropdown] = useState(false);
  
  // Metro filters
  const [metroSelectedTypes, setMetroSelectedTypes] = useState<string[]>([]);
  const [metroPriceFrom, setMetroPriceFrom] = useState('');
  const [metroPriceTo, setMetroPriceTo] = useState('');
  const [metroSortOrder, setMetroSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showMetroSortDropdown, setShowMetroSortDropdown] = useState(false);
  
  // Clan filters
  const [clanLevel, setClanLevel] = useState('');
  const [clanPriceFrom, setClanPriceFrom] = useState('');
  const [clanPriceTo, setClanPriceTo] = useState('');
  const [clanSortOrder, setClanSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showClanSortDropdown, setShowClanSortDropdown] = useState(false);
  
  // Home votes filters
  const [votesAmountFrom, setVotesAmountFrom] = useState('');
  const [votesAmountTo, setVotesAmountTo] = useState('');
  const [votesPriceFrom, setVotesPriceFrom] = useState('');
  const [votesPriceTo, setVotesPriceTo] = useState('');
  const [votesSortOrder, setVotesSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showVotesSortDropdown, setShowVotesSortDropdown] = useState(false);
  
  // Show/hide filters on mobile
  const [showFilters, setShowFilters] = useState(false);
  
  // Costumes filters
  const [costumesSearch, setCostumesSearch] = useState('');
  const [costumesSortOrder, setCostumesSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  
  // Cars filters
  const [carsSearch, setCarsSearch] = useState('');
  const [carsSortOrder, setCarsSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

  // Bottom sheet for accounts/costumes/cars/metro/popularity/homeVotes/clan
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accDetailImageIndex, setAccDetailImageIndex] = useState(0);
  const [accShowCostumes, setAccShowCostumes] = useState(false);
  const [accShowVehicles, setAccShowVehicles] = useState(false);
  const [accShowWeapons, setAccShowWeapons] = useState(false);
  const [accShowOther, setAccShowOther] = useState(false);
  const [accShowPaymentModal, setAccShowPaymentModal] = useState(false);
  const [accShowGuarantee, setAccShowGuarantee] = useState(false);
  const [selectedCostume, setSelectedCostume] = useState<Costume | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedMetro, setSelectedMetro] = useState<MetroItem | null>(null);
  const [selectedPopularity, setSelectedPopularity] = useState<Popularity | null>(null);
  const [selectedHomeVotes, setSelectedHomeVotes] = useState<HomeVotes | null>(null);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [playerIdCostume, setPlayerIdCostume] = useState('');
  const [playerIdCar, setPlayerIdCar] = useState('');
  const [playerIdMetro, setPlayerIdMetro] = useState('');
  const [playerIdPopularity, setPlayerIdPopularity] = useState('');
  const [playerIdHomeVotes, setPlayerIdHomeVotes] = useState('');
  const [playerIdClan, setPlayerIdClan] = useState('');
  const [preferredTimePopularity, setPreferredTimePopularity] = useState('');
  const [timeError, setTimeError] = useState('');
  const [selectedPopAmount, setSelectedPopAmount] = useState('');
  const [selectedVotesAmount, setSelectedVotesAmount] = useState('');
  const [bottomSheetDragY, setBottomSheetDragY] = useState(0);
  const [metroGalleryIndex, setMetroGalleryIndex] = useState(0);

  // Close bottom sheet
  const closeBottomSheet = useCallback(() => {
    setSelectedAccount(null);
    setAccDetailImageIndex(0);
    setAccShowCostumes(false);
    setAccShowVehicles(false);
    setAccShowWeapons(false);
    setAccShowOther(false);
    setAccShowPaymentModal(false);
    setAccShowGuarantee(false);
    setSelectedCostume(null);
    setSelectedCar(null);
    setSelectedMetro(null);
    setSelectedPopularity(null);
    setSelectedHomeVotes(null);
    setSelectedClan(null);
    setPlayerIdCostume('');
    setPlayerIdCar('');
    setPlayerIdMetro('');
    setPlayerIdPopularity('');
    setPlayerIdHomeVotes('');
    setPlayerIdClan('');
    setPreferredTimePopularity('');
    setTimeError('');
    setSelectedPopAmount('');
    setSelectedVotesAmount('');
    setBottomSheetDragY(0);
    setMetroGalleryIndex(0);
  }, []);

  // Toggle popularity type
  const togglePopType = useCallback((typeId: string) => {
    setPopSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  }, []);

  // Toggle metro item type
  const toggleMetroType = useCallback((typeId: string) => {
    setMetroSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  }, []);

  // Filter and sort accounts
  const filteredAccounts = mockAccounts
    .filter(acc => {
      if (accPriceFrom && acc.price < Number(accPriceFrom)) return false;
      if (accPriceTo && acc.price > Number(accPriceTo)) return false;
      if (accCollectionFrom && acc.collectionLevel < Number(accCollectionFrom)) return false;
      if (accCollectionTo && acc.collectionLevel > Number(accCollectionTo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (accSortOrder === 'none') return 0;
      return accSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort popularity
  const filteredPopularity = mockPopularity
    .filter(pop => {
      if (popAmountFrom && pop.amountMax < Number(popAmountFrom)) return false;
      if (popAmountTo && pop.amountMin > Number(popAmountTo)) return false;
      if (popPriceFrom && pop.pricePerThousand < Number(popPriceFrom)) return false;
      if (popPriceTo && pop.pricePerThousand > Number(popPriceTo)) return false;
      if (popSelectedTypes.length > 0 && !popSelectedTypes.some(t => popularityTypes.find(pt => pt.id === t)?.name === pop.type)) return false;
      return true;
    })
    .sort((a, b) => {
      if (popSortOrder === 'none') return 0;
      return popSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort metro items
  const filteredMetroItems = mockMetroItems
    .filter(item => {
      if (metroSelectedTypes.length > 0 && !metroSelectedTypes.includes(item.type)) return false;
      if (metroPriceFrom && item.price < Number(metroPriceFrom)) return false;
      if (metroPriceTo && item.price > Number(metroPriceTo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (metroSortOrder === 'none') return 0;
      return metroSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort clans
  const filteredClans = mockClans
    .filter(clan => {
      if (clanLevel && clan.level < Number(clanLevel)) return false;
      if (clanPriceFrom && clan.price < Number(clanPriceFrom)) return false;
      if (clanPriceTo && clan.price > Number(clanPriceTo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (clanSortOrder === 'none') return 0;
      return clanSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort home votes
  const filteredHomeVotes = mockHomeVotes
    .filter(vote => {
      if (votesAmountFrom && vote.amountMax < Number(votesAmountFrom)) return false;
      if (votesAmountTo && vote.amountMin > Number(votesAmountTo)) return false;
      if (votesPriceFrom && vote.pricePer100 < Number(votesPriceFrom)) return false;
      if (votesPriceTo && vote.pricePer100 > Number(votesPriceTo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (votesSortOrder === 'none') return 0;
      return votesSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort costumes
  const filteredCostumes = mockCostumes
    .filter(costume => {
      if (costumesSearch && !costume.name.toLowerCase().includes(costumesSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (costumesSortOrder === 'none') return 0;
      return costumesSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  // Filter and sort cars
  const filteredCars = mockCars
    .filter(car => {
      if (carsSearch && !car.name.toLowerCase().includes(carsSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (carsSortOrder === 'none') return 0;
      return carsSortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });

  return (
    <div className="min-h-screen  pb-44">
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center relative py-1">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">PUBG Mobile</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">Аккаунты</h1>
        </div>
        {/* Banner with Character - Desktop & Tablet */}
        <section className="hidden md:flex items-stretch h-[280px] lg:h-[320px] relative">
          {/* Character LEFT */}
          <div className="flex-shrink-0 h-full relative pl-5">
            <img 
              src="/акаунты.png" 
              alt="PUBG Character"
              className="h-full w-auto object-contain"
              style={{ backfaceVisibility: 'hidden' }}
            />
          </div>
          
          {/* Banner Carousel */}
          <div className="flex-1 min-w-0 h-full pl-5 pr-8">
            <BannerCarousel banners={banners} />
          </div>
        </section>

        {/* Banner - Mobile only */}
        <section className="md:hidden">
          <BannerCarousel banners={banners} />
        </section>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Filter toggle - hide for costumes and cars */}
        {activeTab !== 'costumes' && activeTab !== 'cars' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-2.5 px-4 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-between text-white"
          >
            <span className="text-sm font-medium">Фильтры</span>
            <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Costumes/Cars inline filters - always visible */}
        {activeTab === 'costumes' && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Поиск костюма..."
              value={costumesSearch}
              onChange={(e) => setCostumesSearch(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
            />
            <div className="relative">
              <button
                onClick={() => setShowAccSortDropdown(!showAccSortDropdown)}
                className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs flex items-center gap-1"
              >
                <span>{costumesSortOrder === 'asc' ? '↑ Дешёвые' : costumesSortOrder === 'desc' ? '↓ Дорогие' : 'Сортировка'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAccSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAccSortDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={() => { setCostumesSortOrder('asc'); setShowAccSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">↑ Сначала дешёвые</button>
                    <button onClick={() => { setCostumesSortOrder('desc'); setShowAccSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">↓ Сначала дорогие</button>
                    <button onClick={() => { setCostumesSortOrder('none'); setShowAccSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">Отключить</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cars' && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Поиск машины..."
              value={carsSearch}
              onChange={(e) => setCarsSearch(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm"
            />
            <div className="relative">
              <button
                onClick={() => setShowPopSortDropdown(!showPopSortDropdown)}
                className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs flex items-center gap-1"
              >
                <span>{carsSortOrder === 'asc' ? '↑ Дешёвые' : carsSortOrder === 'desc' ? '↓ Дорогие' : 'Сортировка'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPopSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPopSortDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={() => { setCarsSortOrder('asc'); setShowPopSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">↑ Сначала дешёвые</button>
                    <button onClick={() => { setCarsSortOrder('desc'); setShowPopSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">↓ Сначала дорогие</button>
                    <button onClick={() => { setCarsSortOrder('none'); setShowPopSortDropdown(false); }} className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-zinc-700">Отключить</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <div>
          {/* Filters - collapsible (not for costumes/cars) */}
          <div className={`space-y-3 mb-4 ${showFilters && activeTab !== 'costumes' && activeTab !== 'cars' ? 'block' : 'hidden'}`}>
            
            {/* ACCOUNTS FILTERS */}
            {activeTab === 'accounts' && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
                <h3 className="text-white font-semibold text-sm">Фильтры</h3>
                
                {/* Price range */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Цена ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={accPriceFrom}
                      onChange={(e) => setAccPriceFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={accPriceTo}
                      onChange={(e) => setAccPriceTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Collection level */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Уровень коллекции</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={accCollectionFrom}
                      onChange={(e) => setAccCollectionFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={accCollectionTo}
                      onChange={(e) => setAccCollectionTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <label className="text-zinc-400 text-xs block mb-2">Сортировка</label>
                  <button
                    onClick={() => setShowAccSortDropdown(!showAccSortDropdown)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-left flex items-center justify-between"
                  >
                    <span>{accSortOrder === 'asc' ? 'От дешёвых к дорогим' : accSortOrder === 'desc' ? 'От дорогих к дешёвым' : 'Не указано'}</span>
                    <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showAccSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showAccSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAccSortDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                        {[
                          { value: 'none', label: 'Не указано' },
                          { value: 'asc', label: 'От дешёвых к дорогим' },
                          { value: 'desc', label: 'От дорогих к дешёвым' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setAccSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowAccSortDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${accSortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* POPULARITY FILTERS - moved here, costumes/cars filters are outside */}
            {activeTab === 'popularity' && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
                <h3 className="text-white font-semibold text-sm">Фильтры</h3>
                
                {/* Amount range */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Количество популярности</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={popAmountFrom}
                      onChange={(e) => setPopAmountFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={popAmountTo}
                      onChange={(e) => setPopAmountTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Price per 1000 */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Цена за 1000 ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="От"
                      value={popPriceFrom}
                      onChange={(e) => setPopPriceFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="До"
                      value={popPriceTo}
                      onChange={(e) => setPopPriceTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Popularity types */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Тип популярности</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {popularityTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => togglePopType(type.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                          popSelectedTypes.includes(type.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {type.icon} {type.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <label className="text-zinc-400 text-xs block mb-2">Сортировка</label>
                  <button
                    onClick={() => setShowPopSortDropdown(!showPopSortDropdown)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-left flex items-center justify-between"
                  >
                    <span>{popSortOrder === 'asc' ? 'От дешёвых к дорогим' : popSortOrder === 'desc' ? 'От дорогих к дешёвым' : 'Не указано'}</span>
                    <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showPopSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showPopSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowPopSortDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                        {[
                          { value: 'none', label: 'Не указано' },
                          { value: 'asc', label: 'От дешёвых к дорогим' },
                          { value: 'desc', label: 'От дорогих к дешёвым' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setPopSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowPopSortDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${popSortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* METRO ROYALE FILTERS */}
            {activeTab === 'metro' && (
              <div className="space-y-3">
                {/* Important notice */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">Без входа в аккаунт</p>
                    <p className="text-emerald-400/70 text-xs mt-0.5">Передача предметов без входа в аккаунт</p>
                  </div>
                </div>
                
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
                  <h3 className="text-white font-semibold text-sm">Фильтры</h3>
                  
                  {/* Item type */}
                  <div>
                    <label className="text-zinc-400 text-xs block mb-2">Тип предметов</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {metroItemTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => toggleMetroType(type.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                            metroSelectedTypes.includes(type.id)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }`}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price range */}
                  <div>
                    <label className="text-zinc-400 text-xs block mb-2">Цена ($)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="От"
                        value={metroPriceFrom}
                        onChange={(e) => setMetroPriceFrom(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        placeholder="До"
                        value={metroPriceTo}
                        onChange={(e) => setMetroPriceTo(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div className="relative">
                    <label className="text-zinc-400 text-xs block mb-2">Сортировка</label>
                    <button
                      onClick={() => setShowMetroSortDropdown(!showMetroSortDropdown)}
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-left flex items-center justify-between"
                    >
                      <span>{metroSortOrder === 'asc' ? 'От дешёвых к дорогим' : metroSortOrder === 'desc' ? 'От дорогих к дешёвым' : 'Не указано'}</span>
                      <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showMetroSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showMetroSortDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMetroSortDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                          {[
                            { value: 'none', label: 'Не указано' },
                            { value: 'asc', label: 'От дешёвых к дорогим' },
                            { value: 'desc', label: 'От дорогих к дешёвым' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => { setMetroSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowMetroSortDropdown(false); }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${metroSortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HOME VOTES FILTERS */}
            {activeTab === 'home-votes' && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
                <h3 className="text-white font-semibold text-sm">Фильтры</h3>
                
                {/* Amount range */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Количество голосов</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={votesAmountFrom}
                      onChange={(e) => setVotesAmountFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={votesAmountTo}
                      onChange={(e) => setVotesAmountTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Price per 100 */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Цена за 100 ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="От"
                      value={votesPriceFrom}
                      onChange={(e) => setVotesPriceFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="До"
                      value={votesPriceTo}
                      onChange={(e) => setVotesPriceTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <label className="text-zinc-400 text-xs block mb-2">Сортировка</label>
                  <button
                    onClick={() => setShowVotesSortDropdown(!showVotesSortDropdown)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-left flex items-center justify-between"
                  >
                    <span>{votesSortOrder === 'asc' ? 'От дешёвых к дорогим' : votesSortOrder === 'desc' ? 'От дорогих к дешёвым' : 'Не указано'}</span>
                    <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showVotesSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showVotesSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowVotesSortDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                        {[
                          { value: 'none', label: 'Не указано' },
                          { value: 'asc', label: 'От дешёвых к дорогим' },
                          { value: 'desc', label: 'От дорогих к дешёвым' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setVotesSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowVotesSortDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${votesSortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* CLAN FILTERS */}
            {activeTab === 'clan' && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl space-y-4">
                <h3 className="text-white font-semibold text-sm">Фильтры</h3>
                
                {/* Clan level */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Минимальный уровень клана</label>
                  <input
                    type="number"
                    placeholder="Уровень"
                    value={clanLevel}
                    onChange={(e) => setClanLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                  />
                </div>
                
                {/* Price range */}
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Цена ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={clanPriceFrom}
                      onChange={(e) => setClanPriceFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={clanPriceTo}
                      onChange={(e) => setClanPriceTo(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <label className="text-zinc-400 text-xs block mb-2">Сортировка</label>
                  <button
                    onClick={() => setShowClanSortDropdown(!showClanSortDropdown)}
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm text-left flex items-center justify-between"
                  >
                    <span className="truncate">{clanSortOrder === 'asc' ? 'От дешёвых к дорогим' : clanSortOrder === 'desc' ? 'От дорогих к дешёвым' : 'Не указано'}</span>
                    <svg className={`w-4 h-4 text-zinc-400 transition-transform ${showClanSortDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showClanSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowClanSortDropdown(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-zinc-700 border border-zinc-600 rounded-lg overflow-hidden z-50">
                        {[
                          { value: 'none', label: 'Не указано' },
                          { value: 'asc', label: 'От дешёвых к дорогим' },
                          { value: 'desc', label: 'От дорогих к дешёвым' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setClanSortOrder(opt.value as 'asc' | 'desc' | 'none'); setShowClanSortDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-600 transition-colors ${clanSortOrder === opt.value ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cards grid */}
          <div className="flex-1">
            
            {/* ACCOUNTS CARDS */}
            {activeTab === 'accounts' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    onClick={() => { setSelectedAccount(account); setAccDetailImageIndex(0); }}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900">
                      <img src={account.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                        <span className="text-emerald-400 font-bold text-base">${account.price}</span>
                        <span className="text-zinc-400 text-xs">🏆 {account.collectionLevel} ур.</span>
                      </div>
                      <p className="text-white text-xs line-clamp-2 mb-1.5">{account.description}</p>
                      <StarRating rating={account.sellerRating} reviews={account.sellerReviews} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COSTUMES CARDS */}
            {activeTab === 'costumes' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredCostumes.map(costume => (
                  <div
                    key={costume.id}
                    onClick={() => setSelectedCostume(costume)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900">
                      <img src={costume.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-white text-xs font-medium truncate flex-1 mr-2">{costume.name}</p>
                        <span className="text-emerald-400 font-bold text-sm">${costume.price}</span>
                      </div>
                      <StarRating rating={costume.sellerRating} reviews={costume.sellerReviews} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CARS CARDS */}
            {activeTab === 'cars' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredCars.map(car => (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900">
                      <img src={car.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-white text-xs font-medium truncate flex-1 mr-2">{car.name}</p>
                        <span className="text-emerald-400 font-bold text-sm">${car.price}</span>
                      </div>
                      <StarRating rating={car.sellerRating} reviews={car.sellerReviews} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* POPULARITY CARDS */}
            {activeTab === 'popularity' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredPopularity.map(pop => (
                  <div
                    key={pop.id}
                    onClick={() => setSelectedPopularity(pop)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900 relative">
                      <img src={pop.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                        <span>🕐</span>
                        <span>{pop.availableFrom}-{pop.availableTo}</span>
                      </div>
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{pop.typeIcon}</span>
                          <p className="text-white font-medium text-sm">{pop.type}</p>
                        </div>
                        <span className="text-emerald-400 font-bold text-sm">${pop.price}</span>
                      </div>
                      <p className="text-zinc-400 text-sm">{pop.amountMin.toLocaleString()}-{pop.amountMax.toLocaleString()} ПП</p>
                      <div className="flex items-center justify-between">
                        <p className="text-zinc-500 text-xs">${pop.pricePerThousand}/1000</p>
                        <StarRating rating={pop.sellerRating} reviews={pop.sellerReviews} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* METRO ROYALE CARDS */}
            {activeTab === 'metro' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredMetroItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedMetro(item); setMetroGalleryIndex(0); }}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900 relative">
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      {item.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white">
                          {item.images.length} фото
                        </div>
                      )}
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <p className="text-white font-medium text-xs mb-1">{item.name}</p>
                      <p className="text-zinc-500 text-xs mb-1">{metroItemTypes.find(t => t.id === item.type)?.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-sm">${item.price}</span>
                        <StarRating rating={item.sellerRating} reviews={item.sellerReviews} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HOME VOTES CARDS */}
            {activeTab === 'home-votes' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredHomeVotes.map(vote => (
                  <div
                    key={vote.id}
                    onClick={() => setSelectedHomeVotes(vote)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900">
                      <img src={vote.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">🏠</span>
                        <span className="text-white font-bold text-xs">{vote.amountMin.toLocaleString()}-{vote.amountMax.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-500 text-xs">${vote.pricePer100}/100</span>
                        <span className="text-emerald-400 font-bold text-sm">${vote.price}</span>
                      </div>
                      <StarRating rating={vote.sellerRating} reviews={vote.sellerReviews} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CLAN CARDS */}
            {activeTab === 'clan' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredClans.map(clan => (
                  <div
                    key={clan.id}
                    onClick={() => setSelectedClan(clan)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-zinc-900">
                      <img src={clan.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 min-h-[70px] flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🛡️</span>
                          <span className="text-white font-bold text-xs truncate">{clan.name}</span>
                        </div>
                        <span className="bg-amber-500 text-black font-bold text-[10px] px-1.5 py-0.5 rounded">Ур.{Math.min(clan.level, 10)}</span>
                      </div>
                      <p className="text-zinc-400 text-xs mb-1 line-clamp-1">{clan.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-sm">${clan.price}</span>
                        <StarRating rating={clan.sellerRating} reviews={clan.sellerReviews} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {((activeTab === 'accounts' && filteredAccounts.length === 0) ||
              (activeTab === 'popularity' && filteredPopularity.length === 0) ||
              (activeTab === 'metro' && filteredMetroItems.length === 0) ||
              (activeTab === 'home-votes' && filteredHomeVotes.length === 0) ||
              (activeTab === 'clan' && filteredClans.length === 0)) && (
              <div className="text-center py-12">
                <p className="text-zinc-400">Ничего не найдено</p>
                <p className="text-zinc-500 text-sm mt-1">Попробуйте изменить фильтры</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Sheet - Costume */}
      {selectedCostume && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={closeBottomSheet}
          />
          
          {/* Sheet */}
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              {/* Image */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                <img src={selectedCostume.image} alt={selectedCostume.name} className="w-full h-full object-cover" />
              </div>
              
              {/* Name & Price */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selectedCostume.name}</h2>
                <span className="text-2xl font-bold text-emerald-400">${selectedCostume.price}</span>
              </div>
              
              {/* Description */}
              <p className="text-zinc-400 text-sm">{selectedCostume.description}</p>

              {/* Delivery time */}
              <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5">
                <span className="text-zinc-500 text-sm">🕐 Доставка:</span>
                <span className="text-white text-sm font-medium">{selectedCostume.deliveryTime}</span>
              </div>
              
              {/* Player ID Input */}
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdCostume}
                  onChange={(e) => setPlayerIdCostume(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              {/* How to get */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">📦 Как получить костюм</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока выше</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Продавец отправит вам подарок в игре</li>
                  <li>4. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              {/* Security notice */}
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения товара
                </p>
              </div>
              
              {/* Buy button */}
              <button 
                disabled={!playerIdCostume.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdCostume.trim() 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedCostume.price}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Car */}
      {selectedCar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={closeBottomSheet}
          />
          
          {/* Sheet */}
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              {/* Image */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                <img src={selectedCar.image} alt={selectedCar.name} className="w-full h-full object-cover" />
              </div>
              
              {/* Name & Price */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selectedCar.name}</h2>
                <span className="text-2xl font-bold text-emerald-400">${selectedCar.price}</span>
              </div>
              
              {/* Description */}
              <p className="text-zinc-400 text-sm">{selectedCar.description}</p>

              {/* Delivery time */}
              <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5">
                <span className="text-zinc-500 text-sm">🕐 Доставка:</span>
                <span className="text-white text-sm font-medium">{selectedCar.deliveryTime}</span>
              </div>
              
              {/* Player ID Input */}
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdCar}
                  onChange={(e) => setPlayerIdCar(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              {/* How to get */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">🚗 Как получить машину</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока выше</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Продавец отправит вам подарок в игре</li>
                  <li>4. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              {/* Security notice */}
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения товара
                </p>
              </div>
              
              {/* Buy button */}
              <button 
                disabled={!playerIdCar.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdCar.trim() 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedCar.price}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Metro */}
      {selectedMetro && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-50"
            onClick={closeBottomSheet}
          />
          
          {/* Sheet */}
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              {/* Gallery */}
              <div className="relative">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                  <img src={selectedMetro.images[metroGalleryIndex]} alt={selectedMetro.name} className="w-full h-full object-cover" />
                </div>
                
                {/* Gallery navigation */}
                {selectedMetro.images.length > 1 && (
                  <>
                    {/* Arrows */}
                    <button 
                      onClick={() => setMetroGalleryIndex(prev => prev > 0 ? prev - 1 : selectedMetro.images.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      ‹
                    </button>
                    <button 
                      onClick={() => setMetroGalleryIndex(prev => prev < selectedMetro.images.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      ›
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selectedMetro.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMetroGalleryIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${idx === metroGalleryIndex ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Name & Price */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{selectedMetro.name}</h2>
                <span className="text-2xl font-bold text-emerald-400">${selectedMetro.price}</span>
              </div>
              
              {/* Description */}
              <p className="text-zinc-400 text-sm">{selectedMetro.description}</p>
              
              {/* Player ID Input */}
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdMetro}
                  onChange={(e) => setPlayerIdMetro(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              {/* How to get */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">🚇 Как получить предмет</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока выше</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Добавьте продавца в друзья в игре</li>
                  <li>4. Продавец передаст вам предметы в Metro Royale</li>
                  <li>5. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              {/* Security notice */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения товара
                </p>
              </div>
              
              {/* Buy button */}
              <button 
                disabled={!playerIdMetro.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdMetro.trim() 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedMetro.price}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Popularity */}
      {selectedPopularity && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={closeBottomSheet} />
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                <img src={selectedPopularity.image} alt="" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPopularity.typeIcon}</span>
                  <h2 className="text-xl font-bold text-white">{selectedPopularity.type}</h2>
                </div>
                <span className="text-2xl font-bold text-emerald-400">${selectedPopularity.price}</span>
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <p className="text-white font-medium">Доступно: {selectedPopularity.amountMin.toLocaleString()} - {selectedPopularity.amountMax.toLocaleString()} ПП</p>
                <p className="text-zinc-400 text-sm">${selectedPopularity.pricePerThousand} за 1000</p>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  Количество ПП * <span className="text-zinc-400">({selectedPopularity.amountMin.toLocaleString()} - {selectedPopularity.amountMax.toLocaleString()})</span>
                </label>
                <input
                  type="number"
                  placeholder={`Введите от ${selectedPopularity.amountMin.toLocaleString()} до ${selectedPopularity.amountMax.toLocaleString()}`}
                  value={selectedPopAmount}
                  onChange={(e) => setSelectedPopAmount(e.target.value)}
                  min={selectedPopularity.amountMin}
                  max={selectedPopularity.amountMax}
                  className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 ${
                    selectedPopAmount && (Number(selectedPopAmount) < selectedPopularity.amountMin || Number(selectedPopAmount) > selectedPopularity.amountMax)
                      ? 'border-red-500'
                      : 'border-zinc-700'
                  }`}
                />
                {selectedPopAmount && (Number(selectedPopAmount) < selectedPopularity.amountMin || Number(selectedPopAmount) > selectedPopularity.amountMax) && (
                  <p className="text-red-400 text-xs mt-1">Количество должно быть от {selectedPopularity.amountMin.toLocaleString()} до {selectedPopularity.amountMax.toLocaleString()}</p>
                )}
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdPopularity}
                  onChange={(e) => setPlayerIdPopularity(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  Удобное время * <span className="text-zinc-400">(продавец онлайн {selectedPopularity.availableFrom} - {selectedPopularity.availableTo})</span>
                </label>
                <input
                  type="text"
                  placeholder={`Введите время (${selectedPopularity.availableFrom} - ${selectedPopularity.availableTo})`}
                  value={preferredTimePopularity}
                  onChange={(e) => {
                    setPreferredTimePopularity(e.target.value);
                    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
                    if (e.target.value && timeRegex.test(e.target.value)) {
                      const fromHour = parseInt(selectedPopularity.availableFrom.split(':')[0]);
                      const toHour = parseInt(selectedPopularity.availableTo.split(':')[0]);
                      const inputHour = parseInt(e.target.value.split(':')[0]);
                      if (inputHour < fromHour || inputHour > toHour) {
                        setTimeError(`Время должно быть между ${selectedPopularity.availableFrom} и ${selectedPopularity.availableTo}`);
                      } else {
                        setTimeError('');
                      }
                    } else if (e.target.value) {
                      setTimeError('Введите время в формате ЧЧ:ММ');
                    } else {
                      setTimeError('');
                    }
                  }}
                  className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 ${
                    timeError ? 'border-red-500' : 'border-zinc-700'
                  }`}
                />
                {timeError && <p className="text-red-400 text-xs mt-1">{timeError}</p>}
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">⭐ Как получить популярность</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока и выберите удобное время</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Добавьте продавца в друзья в игре</li>
                  <li>4. В выбранное время продавец закинет вам популярность</li>
                  <li>5. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения товара
                </p>
              </div>
              
              <button 
                disabled={!playerIdPopularity.trim() || !selectedPopAmount || !preferredTimePopularity || !!timeError || Number(selectedPopAmount) < selectedPopularity.amountMin || Number(selectedPopAmount) > selectedPopularity.amountMax}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdPopularity.trim() && selectedPopAmount && preferredTimePopularity && !timeError && Number(selectedPopAmount) >= selectedPopularity.amountMin && Number(selectedPopAmount) <= selectedPopularity.amountMax
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedPopAmount ? Math.round(Number(selectedPopAmount) * selectedPopularity.pricePerThousand / 1000) : selectedPopularity.price}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Home Votes */}
      {selectedHomeVotes && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={closeBottomSheet} />
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                <img src={selectedHomeVotes.image} alt="" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏠</span>
                  <h2 className="text-xl font-bold text-white">Голоса дома</h2>
                </div>
                <span className="text-2xl font-bold text-emerald-400">${selectedHomeVotes.price}</span>
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <p className="text-white font-medium">Доступно: {selectedHomeVotes.amountMin.toLocaleString()} - {selectedHomeVotes.amountMax.toLocaleString()} голосов</p>
                <p className="text-zinc-400 text-sm">${selectedHomeVotes.pricePer100} за 100 голосов</p>
                <p className="text-zinc-500 text-xs mt-1">{selectedHomeVotes.description}</p>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">
                  Количество голосов * <span className="text-zinc-400">({selectedHomeVotes.amountMin.toLocaleString()} - {selectedHomeVotes.amountMax.toLocaleString()})</span>
                </label>
                <input
                  type="number"
                  placeholder={`Введите от ${selectedHomeVotes.amountMin.toLocaleString()} до ${selectedHomeVotes.amountMax.toLocaleString()}`}
                  value={selectedVotesAmount}
                  onChange={(e) => setSelectedVotesAmount(e.target.value)}
                  min={selectedHomeVotes.amountMin}
                  max={selectedHomeVotes.amountMax}
                  className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 ${
                    selectedVotesAmount && (Number(selectedVotesAmount) < selectedHomeVotes.amountMin || Number(selectedVotesAmount) > selectedHomeVotes.amountMax)
                      ? 'border-red-500'
                      : 'border-zinc-700'
                  }`}
                />
                {selectedVotesAmount && (Number(selectedVotesAmount) < selectedHomeVotes.amountMin || Number(selectedVotesAmount) > selectedHomeVotes.amountMax) && (
                  <p className="text-red-400 text-xs mt-1">Количество должно быть от {selectedHomeVotes.amountMin.toLocaleString()} до {selectedHomeVotes.amountMax.toLocaleString()}</p>
                )}
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdHomeVotes}
                  onChange={(e) => setPlayerIdHomeVotes(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">🏠 Как получить голоса</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока выше</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Добавьте продавца в друзья в игре</li>
                  <li>4. Продавец проголосует за ваш дом</li>
                  <li>5. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения товара
                </p>
              </div>
              
              <button 
                disabled={!playerIdHomeVotes.trim() || !selectedVotesAmount || Number(selectedVotesAmount) < selectedHomeVotes.amountMin || Number(selectedVotesAmount) > selectedHomeVotes.amountMax}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdHomeVotes.trim() && selectedVotesAmount && Number(selectedVotesAmount) >= selectedHomeVotes.amountMin && Number(selectedVotesAmount) <= selectedHomeVotes.amountMax
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedVotesAmount ? Math.round(Number(selectedVotesAmount) * selectedHomeVotes.pricePer100 / 100) : selectedHomeVotes.price}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom Sheet - Account Detail */}
      {selectedAccount && (() => {
        const detail = accountDetails[selectedAccount.id];
        if (!detail) return null;
        const getRarityColor = (rarity: string) => {
          switch (rarity) {
            case 'Mythic': return 'text-red-400';
            case 'Legendary': return 'text-yellow-400';
            case 'Epic': return 'text-purple-400';
            case 'Rare': return 'text-blue-400';
            default: return 'text-zinc-400';
          }
        };
        return (
          <>
            <div className="fixed inset-0 bg-black/80 z-50" onClick={closeBottomSheet} />
            <div 
              className="fixed bottom-[65px] md:bottom-[72px] left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl overflow-hidden border-2 border-zinc-600"
              style={{ top: '80px', ...(bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : {}) }}
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const handleMove = (ev: TouchEvent) => {
                  const diff = ev.touches[0].clientY - startY;
                  if (diff > 0) setBottomSheetDragY(diff);
                };
                const handleEnd = () => {
                  if (bottomSheetDragY > 100) closeBottomSheet();
                  else setBottomSheetDragY(0);
                  document.removeEventListener('touchmove', handleMove);
                  document.removeEventListener('touchend', handleEnd);
                };
                document.addEventListener('touchmove', handleMove);
                document.addEventListener('touchend', handleEnd);
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-4 pb-6 space-y-3" style={{ maxHeight: 'calc(100% - 28px)' }}>
                {/* Image Gallery */}
                <div className="relative aspect-[4/3] bg-zinc-800 rounded-xl overflow-hidden">
                  <img
                    src={detail.images[accDetailImageIndex]}
                    alt={`Аккаунт ${selectedAccount.id}`}
                    className="w-full h-full object-cover"
                  />
                  {detail.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setAccDetailImageIndex(prev => prev > 0 ? prev - 1 : detail.images.length - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                      >‹</button>
                      <button
                        onClick={() => setAccDetailImageIndex(prev => prev < detail.images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                      >›</button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {detail.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setAccDetailImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === accDetailImageIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Price + Collection row */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-900/40 to-zinc-800/80 border border-emerald-500/30 rounded-xl">
                  <div>
                    <p className="text-zinc-400 text-xs">Цена аккаунта</p>
                    <p className="text-2xl font-bold text-emerald-400">${detail.price}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-1.5 bg-zinc-800/50 rounded-lg">
                      <p className="text-zinc-500 text-xs">Коллекция</p>
                      <p className="text-white font-bold">{detail.collectionLevel}</p>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-zinc-800/50 rounded-lg">
                      <p className="text-zinc-500 text-xs">ID</p>
                      <p className="text-white font-bold text-xs">{selectedAccount.id}</p>
                    </div>
                  </div>
                </div>

                {/* Review Link */}
                {detail.reviewLink && (
                  <a
                    href={detail.reviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-600 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-sm">Смотреть обзор</span>
                  </a>
                )}

                {/* Guarantee + Support */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAccShowGuarantee(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-emerald-400 font-medium text-xs">Гарантия</span>
                  </button>
                  <button
                    onClick={() => navigate('/messages')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-800 border border-zinc-600 rounded-xl hover:bg-zinc-700 transition-all"
                  >
                    <svg className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-zinc-300 font-medium text-xs">Поддержка</span>
                  </button>
                </div>

                {/* RP Seasons */}
                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <p className="text-zinc-400 text-xs mb-2">RP сезоны</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.rpSeasons.flat().map((rp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-700/50 rounded-lg text-white text-xs font-medium">{rp}</span>
                    ))}
                  </div>
                </div>

                {/* Accordions */}
                <div className="space-y-2">
                  {/* Rare Costumes */}
                  {detail.rareCostumes.length > 0 && (
                    <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                      <button
                        onClick={() => setAccShowCostumes(!accShowCostumes)}
                        className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                      >
                        <span className="text-white font-medium text-sm">👗 Редкие костюмы <span className="text-emerald-400">({detail.rareCostumes.length})</span></span>
                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${accShowCostumes ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {accShowCostumes && (
                        <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                          {detail.rareCostumes.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-white text-sm">{item.name}</span>
                              <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Skins */}
                  {detail.vehicleSkins.length > 0 && (
                    <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                      <button
                        onClick={() => setAccShowVehicles(!accShowVehicles)}
                        className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                      >
                        <span className="text-white font-medium text-sm">🚗 Транспорт <span className="text-emerald-400">({detail.vehicleSkins.length})</span></span>
                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${accShowVehicles ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {accShowVehicles && (
                        <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                          {detail.vehicleSkins.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-white text-sm">{item.name}</span>
                              <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weapon Skins */}
                  {detail.weaponSkins.length > 0 && (
                    <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                      <button
                        onClick={() => setAccShowWeapons(!accShowWeapons)}
                        className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                      >
                        <span className="text-white font-medium text-sm">🔫 Оружие <span className="text-emerald-400">({detail.weaponSkins.length})</span></span>
                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${accShowWeapons ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {accShowWeapons && (
                        <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                          {detail.weaponSkins.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-white text-sm">{item.name}</span>
                              <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Items */}
                  {detail.otherItems.length > 0 && (
                    <div className="border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-800/30">
                      <button
                        onClick={() => setAccShowOther(!accShowOther)}
                        className="w-full flex items-center justify-between py-3 px-4 hover:bg-zinc-700/30 transition-all"
                      >
                        <span className="text-white font-medium text-sm">📦 Другое <span className="text-emerald-400">({detail.otherItems.length})</span></span>
                        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${accShowOther ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {accShowOther && (
                        <div className="p-3 bg-zinc-900/50 space-y-2 border-t border-zinc-700/30">
                          {detail.otherItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-white text-sm">{item.name}</span>
                              <span className={`text-xs font-medium ${getRarityColor(item.rarity)}`}>{item.rarity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Purchase Info */}
                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <h4 className="text-white font-bold text-sm mb-2">Информация о покупке</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    После оплаты вы получите полный доступ к аккаунту. Данные для входа будут отправлены в чат с продавцом. 
                    Рекомендуем сразу сменить пароль и привязать свою почту. Сделка защищена гарантией возврата.
                  </p>
                </div>

                {/* Security notice */}
                <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-3">
                  <p className="text-emerald-400 text-xs">
                    🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения аккаунта
                  </p>
                </div>

                {/* Buy button */}
                <button
                  onClick={() => setAccShowPaymentModal(true)}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-all"
                >
                  Купить аккаунт — ${detail.price}
                </button>
              </div>
            </div>

            {/* Guarantee Modal */}
            {accShowGuarantee && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setAccShowGuarantee(false)} />
                <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-600 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Гарантия сделки</h3>
                  </div>
                  <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                    Сделка защищена. Продавец не получит оплату, пока вы не подтвердите получение товара. 
                    В случае любых проблем — мы вернём деньги.
                  </p>
                  <button onClick={() => setAccShowGuarantee(false)} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all">
                    Понял, спасибо
                  </button>
                </div>
              </div>
            )}

            {/* Payment Modal */}
            {accShowPaymentModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setAccShowPaymentModal(false)} />
                <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-600 p-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Оплата в разработке</h3>
                  <p className="text-zinc-400 text-sm mb-4">Функция оплаты скоро будет доступна. Следите за обновлениями!</p>
                  <button onClick={() => setAccShowPaymentModal(false)} className="w-full py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold transition-all">
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Bottom Sheet - Clan */}
      {selectedClan && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={closeBottomSheet} />
          <div 
            className="fixed bottom-[65px] md:bottom-24 left-0 right-0 md:left-0 md:right-0 md:mx-auto md:w-[650px] md:rounded-3xl z-50 bg-zinc-900 rounded-t-3xl max-h-[75vh] overflow-y-auto border-2 border-zinc-600"
            style={bottomSheetDragY ? { transform: `translateY(${bottomSheetDragY}px)` } : undefined}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleMove = (ev: TouchEvent) => {
                const diff = ev.touches[0].clientY - startY;
                if (diff > 0) setBottomSheetDragY(diff);
              };
              const handleEnd = () => {
                if (bottomSheetDragY > 100) closeBottomSheet();
                else setBottomSheetDragY(0);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleEnd);
              };
              document.addEventListener('touchmove', handleMove);
              document.addEventListener('touchend', handleEnd);
            }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
            </div>
            
            <div className="px-4 pb-8 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800">
                <img src={selectedClan.image} alt="" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedClan.name}</h2>
                    <p className="text-zinc-400 text-sm">Уровень {selectedClan.level}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-400">${selectedClan.price}</span>
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <p className="text-zinc-400 text-sm">{selectedClan.description}</p>
              </div>
              
              <div>
                <label className="text-white text-sm font-medium block mb-2">Ваш ID PUBG Mobile *</label>
                <input
                  type="text"
                  placeholder="Введите ваш ID"
                  value={playerIdClan}
                  onChange={(e) => setPlayerIdClan(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500"
                />
              </div>
              
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2">🛡️ Как получить клан</h3>
                <ol className="text-zinc-400 text-xs space-y-1.5">
                  <li>1. Укажите ваш ID игрока выше</li>
                  <li>2. Нажмите "Купить" и оплатите заказ</li>
                  <li>3. Добавьте продавца в друзья в игре</li>
                  <li>4. Продавец пригласит вас в клан</li>
                  <li>5. После вступления в клан, продавец передаст вам лидерство</li>
                  <li>6. Подтвердите получение в личном кабинете</li>
                </ol>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-amber-400 text-xs">
                  ⚠️ Важно: Вы должны выйти из текущего клана перед покупкой, чтобы продавец мог вас пригласить
                </p>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs">
                  🔒 Безопасная сделка: продавец получит оплату только после вашего подтверждения получения лидерства
                </p>
              </div>
              
              <button 
                disabled={!playerIdClan.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  playerIdClan.trim() 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Купить за ${selectedClan.price}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountsPage;
