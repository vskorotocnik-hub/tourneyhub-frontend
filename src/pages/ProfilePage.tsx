import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentApi } from '../lib/api';
import type { TournamentHistoryItem } from '../lib/api';

// ============ TYPES ============
type ProfileTab = 'my_items' | 'purchases' | 'sales' | 'tournaments' | 'clan';
type ItemFilter = 'active' | 'completed';
type TournamentFilter = 'active' | 'completed';
type ClanMatchFilter = 'active' | 'completed';
type ItemCategory = 'account' | 'uc' | 'rental' | 'boost' | 'popularity' | 'costume' | 'car' | 'rp';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  status: 'active' | 'sold' | 'hidden';
  createdAt: Date;
  category: ItemCategory;
  collectionLevel?: number;
  pricePerHour?: number;
  rentalEnds?: Date;
  ucAmount?: number;
}

interface Purchase {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  date: Date;
  status: 'completed' | 'pending' | 'cancelled';
  category: ItemCategory;
  image?: string;
  collectionLevel?: number;
  rentalHours?: number;
  rentalEnds?: Date;
  ucAmount?: number;
}

interface Sale {
  id: string;
  title: string;
  description: string;
  price: number;
  buyer: string;
  date: Date;
  status: 'completed' | 'pending';
  category: ItemCategory;
  image?: string;
  collectionLevel?: number;
  ucAmount?: number;
}


interface ClanMatch {
  id: string;
  opponent: string;
  opponentLogo: string;
  date: Date;
  status: 'active' | 'completed';
  result?: 'win' | 'loss';
  score?: string;
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  logo: string;
  members: number;
  floor: number;
  wins: number;
  losses: number;
}

// ============ MOCK DATA ============
const userProfile = {
  id: '1',
  username: 'ProGamer228',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer228',
  email: 'progamer228@email.com',
  phone: '+7 (999) 123-45-67',
  registeredAt: new Date('2024-01-15'),
  balance: 156.50,
  gameBalance: 2400,
  currency: 'USD',
  rating: 1847,
  hasClan: true,
};

const userClan: Clan | null = {
  id: 'c1',
  name: 'Dark Legion',
  tag: 'DL',
  logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=DarkLegion',
  members: 24,
  floor: 3,
  wins: 47,
  losses: 12,
};

const myProducts: Product[] = [
  { id: 'p1', title: 'Аккаунт Conqueror S15', description: 'K/D 4.5, 500+ игр', price: 120, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', status: 'active', createdAt: new Date('2024-12-18'), category: 'account', collectionLevel: 85 },
  { id: 'p2', title: '3000 UC код', description: 'Моментальная доставка', price: 35, image: 'https://api.dicebear.com/7.x/shapes/svg?seed=uc1', status: 'sold', createdAt: new Date('2024-12-10'), category: 'uc', ucAmount: 3000 },
  { id: 'p3', title: 'Аккаунт Ace S18', description: 'K/D 5.1, 800+ игр', price: 200, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', status: 'active', createdAt: new Date('2024-12-20'), category: 'account', collectionLevel: 72 },
  { id: 'p4', title: '600 UC код', description: 'Быстрая доставка', price: 8, image: 'https://api.dicebear.com/7.x/shapes/svg?seed=uc4', status: 'active', createdAt: new Date('2024-12-21'), category: 'uc', ucAmount: 600 },
  { id: 'p5', title: 'Аккаунт Crown S16', description: 'K/D 3.8, 350+ игр', price: 75, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', status: 'sold', createdAt: new Date('2024-12-08'), category: 'account', collectionLevel: 55 },
  { id: 'p6', title: 'RP Pass Season 20', description: 'Полный пасс', price: 12, image: 'https://api.dicebear.com/7.x/shapes/svg?seed=rp6', status: 'active', createdAt: new Date('2024-12-22'), category: 'rp' },
  { id: 'p7', title: 'Аренда Diamond S14', description: 'K/D 2.9, 200+ игр', price: 50, image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f764e?w=400', status: 'sold', createdAt: new Date('2024-12-05'), category: 'rental', pricePerHour: 0.8, collectionLevel: 48 },
  { id: 'p8', title: '1500 UC код', description: 'Моментальная доставка', price: 18, image: 'https://api.dicebear.com/7.x/shapes/svg?seed=uc8', status: 'active', createdAt: new Date('2024-12-23'), category: 'uc', ucAmount: 1500 },
  { id: 'p9', title: 'Glacier M416 аккаунт', description: 'Редкий скин', price: 300, image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400', status: 'active', createdAt: new Date('2024-12-24'), category: 'account', collectionLevel: 95 },
  { id: 'p10', title: '6000 UC код', description: 'Выгодная цена', price: 65, image: 'https://api.dicebear.com/7.x/shapes/svg?seed=uc10', status: 'sold', createdAt: new Date('2024-12-01'), category: 'uc', ucAmount: 6000 },
];

const myPurchases: Purchase[] = [
  { id: 'pu1', title: '660 UC', description: 'PUBG Mobile', price: 9.99, seller: 'UCShop', date: new Date('2024-12-18'), status: 'completed', category: 'uc', ucAmount: 660 },
  { id: 'pu2', title: 'Буст до Platinum', description: 'Gold → Platinum', price: 25, seller: 'ProBooster_X', date: new Date('2024-12-17'), status: 'completed', category: 'boost', image: 'https://i.pravatar.cc/150?img=11' },
  { id: 'pu3', title: 'Аренда Conqueror', description: '24 часа', price: 15, seller: 'AccRental', date: new Date('2024-12-15'), status: 'pending', category: 'rental', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', rentalHours: 24, rentalEnds: new Date('2025-01-15'), collectionLevel: 88 },
  { id: 'pu4', title: '3000 UC', description: 'PUBG Mobile', price: 34.99, seller: 'UCMaster', date: new Date('2024-12-14'), status: 'completed', category: 'uc', ucAmount: 3000 },
  { id: 'pu5', title: 'Аккаунт Crown', description: 'K/D 3.5, 350+ игр', price: 60, seller: 'AccStore', date: new Date('2024-12-13'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', collectionLevel: 55 },
  { id: 'pu6', title: 'Буст до Diamond', description: 'Platinum → Diamond', price: 40, seller: 'BoostKing', date: new Date('2024-12-12'), status: 'pending', category: 'boost', image: 'https://i.pravatar.cc/150?img=12' },
  { id: 'pu7', title: 'RP Pass S19', description: 'Royale Pass', price: 10, seller: 'RPShop', date: new Date('2024-12-11'), status: 'completed', category: 'rp' },
  { id: 'pu8', title: '1500 UC', description: 'PUBG Mobile', price: 17.99, seller: 'UCShop', date: new Date('2024-12-10'), status: 'completed', category: 'uc', ucAmount: 1500 },
  { id: 'pu9', title: 'Аренда Ace аккаунт', description: '12 часов', price: 10, seller: 'RentPro', date: new Date('2024-12-09'), status: 'pending', category: 'rental', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f764e?w=400', rentalHours: 12, rentalEnds: new Date('2025-01-10'), collectionLevel: 72 },
  { id: 'pu10', title: 'Аккаунт Glacier M416', description: 'Редкий скин, K/D 4.2', price: 150, seller: 'SkinDealer', date: new Date('2024-12-08'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400', collectionLevel: 90 },
];

const mySales: Sale[] = [
  { id: 's1', title: '3000 UC код', description: 'Код активации', price: 35, buyer: 'Gamer_Pro', date: new Date('2024-12-15'), status: 'completed', category: 'uc', ucAmount: 3000 },
  { id: 's2', title: 'Аккаунт Diamond', description: 'K/D 3.2, 300+ игр', price: 80, buyer: 'NewPlayer', date: new Date('2024-12-12'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', collectionLevel: 62 },
  { id: 's3', title: '660 UC код', description: 'Код активации', price: 9, buyer: 'SkyWalker', date: new Date('2024-12-20'), status: 'pending', category: 'uc', ucAmount: 660 },
  { id: 's4', title: 'Аккаунт Platinum S17', description: 'K/D 2.8, 250+ игр', price: 45, buyer: 'ProHunter', date: new Date('2024-12-11'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', collectionLevel: 40 },
  { id: 's5', title: 'RP Pass S18', description: 'Royale Pass', price: 10, buyer: 'RPfan', date: new Date('2024-12-10'), status: 'completed', category: 'rp' },
  { id: 's6', title: '6000 UC код', description: 'Большой пакет', price: 65, buyer: 'BigSpender', date: new Date('2024-12-22'), status: 'pending', category: 'uc', ucAmount: 6000 },
  { id: 's7', title: 'Аккаунт Crown S15', description: 'K/D 4.0, 400+ игр', price: 90, buyer: 'EliteGamer', date: new Date('2024-12-09'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', collectionLevel: 70 },
  { id: 's8', title: '1500 UC код', description: 'Код активации', price: 18, buyer: 'CasualOne', date: new Date('2024-12-08'), status: 'completed', category: 'uc', ucAmount: 1500 },
  { id: 's9', title: 'Glacier скин аккаунт', description: 'Редкий скин, K/D 4.5', price: 250, buyer: 'Collector_X', date: new Date('2024-12-23'), status: 'pending', category: 'account', image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400', collectionLevel: 92 },
  { id: 's10', title: 'Аккаунт Ace S16', description: 'K/D 5.2, 600+ игр', price: 180, buyer: 'TopPlayer', date: new Date('2024-12-07'), status: 'completed', category: 'account', image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f764e?w=400', collectionLevel: 85 },
];


const clanMatches: ClanMatch[] = [
  { id: 'cm1', opponent: 'Phoenix Squad', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Phoenix', date: new Date('2024-12-26'), status: 'active' },
  { id: 'cm2', opponent: 'Steel Warriors', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Steel', date: new Date('2024-12-20'), status: 'completed', result: 'win', score: '3:1' },
  { id: 'cm3', opponent: 'Night Hunters', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Night', date: new Date('2024-12-18'), status: 'completed', result: 'win', score: '3:2' },
  { id: 'cm4', opponent: 'Elite Force', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Elite', date: new Date('2024-12-15'), status: 'completed', result: 'loss', score: '1:3' },
  { id: 'cm5', opponent: 'Shadow Clan', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Shadow', date: new Date('2024-12-29'), status: 'active' },
  { id: 'cm6', opponent: 'Dragon Lords', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Dragon', date: new Date('2024-12-14'), status: 'completed', result: 'win', score: '3:0' },
  { id: 'cm7', opponent: 'Ice Wolves', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Ice', date: new Date('2024-12-12'), status: 'completed', result: 'loss', score: '2:3' },
  { id: 'cm8', opponent: 'Thunder Strike', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Thunder', date: new Date('2024-12-31'), status: 'active' },
  { id: 'cm9', opponent: 'Venom Squad', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Venom', date: new Date('2024-12-10'), status: 'completed', result: 'win', score: '3:1' },
  { id: 'cm10', opponent: 'Titan Army', opponentLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=Titan', date: new Date('2024-12-08'), status: 'completed', result: 'loss', score: '0:3' },
];

// ============ COMPONENT ============
const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('my_items');
  const [tournamentFilter, setTournamentFilter] = useState<TournamentFilter>('active');
  const [clanMatchFilter, setClanMatchFilter] = useState<ClanMatchFilter>('active');
  const [showSettings, setShowSettings] = useState(false);
  const [showTopUp, setShowTopUp] = useState<'money' | 'uc' | null>(null);
  const [itemFilter, setItemFilter] = useState<ItemFilter>('active');
  const [purchaseFilter, setPurchaseFilter] = useState<ItemFilter>('active');
  const [saleFilter, setSaleFilter] = useState<ItemFilter>('active');

  // Real tournament history from API
  const [realTournaments, setRealTournaments] = useState<TournamentHistoryItem[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'tournaments') {
      setTournamentsLoading(true);
      tournamentApi.myHistory()
        .then(data => setRealTournaments(data.tournaments))
        .catch(() => {})
        .finally(() => setTournamentsLoading(false));
    }
  }, [activeTab]);

  const filteredRealTournaments = realTournaments.filter(t => {
    if (tournamentFilter === 'active') return t.status === 'SEARCHING' || t.status === 'IN_PROGRESS' || t.status === 'DISPUTED';
    return t.status === 'COMPLETED' || t.status === 'CANCELLED';
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'pending': return 'В обработке';
      case 'cancelled': return 'Отменено';
      case 'active': return 'Активно';
      case 'sold': return 'Продано';
      case 'hidden': return 'Скрыто';
      default: return status;
    }
  };

  const tabs = [
    { id: 'my_items' as ProfileTab, label: 'Мои товары', icon: '📦' },
    { id: 'purchases' as ProfileTab, label: 'Покупки', icon: '🛒' },
    { id: 'sales' as ProfileTab, label: 'Продажи', icon: '💰' },
    { id: 'tournaments' as ProfileTab, label: 'Турниры', icon: '🏆' },
    { id: 'clan' as ProfileTab, label: userClan ? `Клан • ${userClan.name}` : 'Клан', icon: '⚔️' },
  ];

  const filteredClanMatches = clanMatches.filter(m => m.status === clanMatchFilter);
  const filteredProducts = myProducts.filter(p => itemFilter === 'active' ? p.status === 'active' : p.status !== 'active');
  const filteredPurchases = myPurchases.filter(p => purchaseFilter === 'active' ? p.status === 'pending' : p.status === 'completed');
  const filteredSales = mySales.filter(s => saleFilter === 'active' ? s.status === 'pending' : s.status === 'completed');

  return (
    <div className="min-h-screen pb-44 relative">
      {/* Profile Character - Only when width > 1260px */}
      <div className="hidden character:block fixed right-0 bottom-0 z-10 pointer-events-none">
        <img 
          src="/профиль.png" 
          alt="Profile Character" 
          className="h-[95vh] w-auto object-contain translate-y-[-30px]"
        />
      </div>
      
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 pt-6 character:pr-[580px]">
        
        {/* Profile Header + Balance - Compact Left Layout on Desktop */}
        <div className="md:flex md:gap-8 mb-6">
          
          {/* Left Column: Profile + Balance */}
          <div className="md:w-[400px] md:flex-shrink-0">
            
            {/* Profile Card */}
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img 
                    src={user?.avatar || userProfile.avatar} 
                    alt={user?.username || userProfile.username}
                    className="w-16 h-16 rounded-full border-2 border-purple-500"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full" />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-white">{user?.username || userProfile.username}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">🏆 {user?.rating ?? userProfile.rating}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/40">с {formatDate(userProfile.registeredAt)}</span>
                  </div>
                </div>
                {/* Lobby Bot - Mobile Only */}
                <button 
                  onClick={() => navigate('/bots')}
                  className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                >
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-medium text-purple-300">Бот</span>
                </button>
              </div>
              
              {/* Balance */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">💵 Баланс</p>
                  <p className="text-lg font-bold text-green-400">${user ? Number(user.balance).toFixed(2) : userProfile.balance.toFixed(2)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">🎮 UC</p>
                  <p className="text-lg font-bold text-yellow-400">{user ? Number(user.ucBalance).toLocaleString() : 0} UC</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowTopUp('money')} className="py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white text-sm font-medium transition-colors">
                  + Пополнить $
                </button>
                <button onClick={() => setShowTopUp('uc')} className="py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-white text-sm font-medium transition-colors">
                  + Пополнить UC
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-white/70 text-xs font-medium transition-colors">
                  💸 Вывести $
                </button>
                <button className="py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-white/70 text-xs font-medium transition-colors">
                  � Вывести UC
                </button>
              </div>
              
              {/* Quick Links */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                {/* Mobile: Друзья, Desktop/Tablet: Лобби бот */}
                <button 
                  onClick={() => navigate('/friends')} 
                  className="md:hidden flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-white/60 text-sm"
                >
                  <span>👥</span> Друзья
                </button>
                <button 
                  onClick={() => navigate('/bots')} 
                  className="hidden md:flex flex-1 items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/15 to-pink-600/15 border border-purple-500/30 hover:border-purple-500/50 transition-all text-purple-300 text-sm font-medium"
                >
                  <span>🤖</span> Лобби бот
                </button>
                <button onClick={() => setShowSettings(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-white/60 text-sm">
                  <span>⚙️</span> Настройки
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-slate-800/50 text-white/60 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          
          {/* My Items Tab */}
          {activeTab === 'my_items' && (
            <>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setItemFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${itemFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Активные</button>
                <button onClick={() => setItemFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${itemFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Завершённые</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                  <div key={p.id} className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer">
                    {/* Account / Rental card with image */}
                    {(p.category === 'account' || p.category === 'rental') && (
                      <>
                        <div className="aspect-[4/3] bg-zinc-900 relative">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                          <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-medium rounded ${p.status === 'active' ? 'bg-blue-500/90 text-white' : 'bg-purple-500/90 text-white'}`}>{getStatusText(p.status)}</span>
                          {p.category === 'rental' && <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500/90 text-white text-[9px] font-medium rounded">Аренда</span>}
                        </div>
                        <div className="p-3 min-h-[70px] flex flex-col justify-center">
                          <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                            <span className="text-emerald-400 font-bold text-base">{p.category === 'rental' ? `$${p.pricePerHour}/час` : `$${p.price}`}</span>
                            {p.collectionLevel && <span className="text-zinc-400 text-xs">🏆 {p.collectionLevel} ур.</span>}
                          </div>
                          <p className="text-white text-xs line-clamp-2">{p.description}</p>
                        </div>
                      </>
                    )}
                    {/* UC card */}
                    {p.category === 'uc' && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-medium rounded ${p.status === 'active' ? 'bg-blue-500/90 text-white' : 'bg-purple-500/90 text-white'}`}>{getStatusText(p.status)}</span>
                          <div className="text-center">
                            <span className="text-4xl">💎</span>
                            <p className="text-white font-bold text-lg mt-1">{p.ucAmount?.toLocaleString()} UC</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-emerald-400 font-bold">${p.price}</p>
                          <p className="text-xs text-white/40">{p.description}</p>
                        </div>
                      </>
                    )}
                    {/* RP / Other card */}
                    {(p.category === 'rp' || p.category === 'costume' || p.category === 'car' || p.category === 'popularity' || p.category === 'boost') && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-medium rounded ${p.status === 'active' ? 'bg-blue-500/90 text-white' : 'bg-purple-500/90 text-white'}`}>{getStatusText(p.status)}</span>
                          <div className="text-center">
                            <span className="text-4xl">{p.category === 'rp' ? '🎫' : p.category === 'boost' ? '🚀' : p.category === 'popularity' ? '⭐' : '🛍️'}</span>
                            <p className="text-white font-medium text-sm mt-2">{p.title}</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-emerald-400 font-bold">${p.price}</p>
                          <p className="text-xs text-white/40">{p.description}</p>
                        </div>
                      </>
                    )}
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-white/40 text-sm">Нет товаров</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setPurchaseFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${purchaseFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Активные</button>
                <button onClick={() => setPurchaseFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${purchaseFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Завершённые</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredPurchases.length > 0 ? filteredPurchases.map((p) => (
                  <div key={p.id} className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer">
                    {/* Account card */}
                    {p.category === 'account' && (
                      <>
                        <div className="aspect-[4/3] bg-zinc-900 relative">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 text-white text-[9px] font-medium rounded">Покупка</span>
                        </div>
                        <div className="p-3 min-h-[70px] flex flex-col justify-center">
                          <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                            <span className="text-red-400 font-bold text-base">-${p.price}</span>
                            {p.collectionLevel && <span className="text-zinc-400 text-xs">🏆 {p.collectionLevel} ур.</span>}
                          </div>
                          <p className="text-white text-xs line-clamp-1">{p.title}</p>
                          <p className="text-zinc-400 text-xs">от {p.seller} • {formatDate(p.date)}</p>
                        </div>
                      </>
                    )}
                    {/* Rental card */}
                    {p.category === 'rental' && (
                      <>
                        <div className="aspect-[4/3] bg-zinc-900 relative">
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500/90 text-white text-[9px] font-medium rounded">Аренда</span>
                        </div>
                        <div className="p-3 min-h-[70px] flex flex-col justify-center">
                          <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                            <span className="text-red-400 font-bold text-base">-${p.price}</span>
                            {p.collectionLevel && <span className="text-zinc-400 text-xs">🏆 {p.collectionLevel} ур.</span>}
                          </div>
                          <p className="text-white text-xs">{p.rentalHours}ч аренды</p>
                          {p.rentalEnds && <p className="text-orange-400 text-xs">до {formatDate(p.rentalEnds)}</p>}
                          <p className="text-zinc-400 text-xs">от {p.seller}</p>
                        </div>
                      </>
                    )}
                    {/* UC card */}
                    {p.category === 'uc' && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 text-white text-[9px] font-medium rounded">Покупка</span>
                          <div className="text-center">
                            <span className="text-4xl">💎</span>
                            <p className="text-white font-bold text-lg mt-1">{p.ucAmount?.toLocaleString()} UC</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-red-400 font-bold">-${p.price}</p>
                          <p className="text-xs text-white/40">от {p.seller} • {formatDate(p.date)}</p>
                        </div>
                      </>
                    )}
                    {/* Boost card */}
                    {p.category === 'boost' && (
                      <>
                        <div className="aspect-[4/3] bg-gradient-to-b from-purple-900/40 to-slate-900 relative flex items-center justify-center">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-500/90 text-white text-[9px] font-medium rounded">Буст</span>
                          <img src={p.image} alt="" className="w-16 h-16 rounded-full border-2 border-purple-500" />
                        </div>
                        <div className="p-3 min-h-[70px] flex flex-col justify-center">
                          <p className="text-white text-xs font-medium mb-1">{p.title}</p>
                          <p className="text-zinc-400 text-xs mb-1">{p.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-red-400 font-bold text-sm">-${p.price}</span>
                            <span className="text-zinc-500 text-xs">{p.seller}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {/* RP / Other */}
                    {(p.category === 'rp' || p.category === 'costume' || p.category === 'car' || p.category === 'popularity') && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/90 text-white text-[9px] font-medium rounded">Покупка</span>
                          <div className="text-center">
                            <span className="text-4xl">{p.category === 'rp' ? '🎫' : p.category === 'popularity' ? '⭐' : '🛍️'}</span>
                            <p className="text-white font-medium text-sm mt-2">{p.title}</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-red-400 font-bold">-${p.price}</p>
                          <p className="text-xs text-white/40">от {p.seller} • {formatDate(p.date)}</p>
                        </div>
                      </>
                    )}
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-3xl mb-2">🛒</p>
                    <p className="text-white/40 text-sm">Нет покупок</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setSaleFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${saleFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Активные</button>
                <button onClick={() => setSaleFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${saleFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Завершённые</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredSales.length > 0 ? filteredSales.map((s) => (
                  <div key={s.id} className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-zinc-500 transition-all cursor-pointer">
                    {/* Account card */}
                    {s.category === 'account' && (
                      <>
                        <div className="aspect-[4/3] bg-zinc-900 relative">
                          <img src={s.image} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-medium rounded">Продажа</span>
                        </div>
                        <div className="p-3 min-h-[70px] flex flex-col justify-center">
                          <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                            <span className="text-emerald-400 font-bold text-base">+${s.price}</span>
                            {s.collectionLevel && <span className="text-zinc-400 text-xs">🏆 {s.collectionLevel} ур.</span>}
                          </div>
                          <p className="text-white text-xs line-clamp-1">{s.title}</p>
                          <p className="text-zinc-400 text-xs">{s.buyer} • {formatDate(s.date)}</p>
                        </div>
                      </>
                    )}
                    {/* UC card */}
                    {s.category === 'uc' && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-medium rounded">Продажа</span>
                          <div className="text-center">
                            <span className="text-4xl">💎</span>
                            <p className="text-white font-bold text-lg mt-1">{s.ucAmount?.toLocaleString()} UC</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-emerald-400 font-bold">+${s.price}</p>
                          <p className="text-xs text-white/40">{s.buyer} • {formatDate(s.date)}</p>
                        </div>
                      </>
                    )}
                    {/* RP / Other */}
                    {(s.category === 'rp' || s.category === 'costume' || s.category === 'car' || s.category === 'popularity' || s.category === 'boost' || s.category === 'rental') && (
                      <>
                        <div className="aspect-square flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900 relative">
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-medium rounded">Продажа</span>
                          <div className="text-center">
                            <span className="text-4xl">{s.category === 'rp' ? '🎫' : s.category === 'rental' ? '🔑' : s.category === 'boost' ? '🚀' : s.category === 'popularity' ? '⭐' : '🛍️'}</span>
                            <p className="text-white font-medium text-sm mt-2">{s.title}</p>
                          </div>
                        </div>
                        <div className="p-3 text-center border-t border-slate-700/50">
                          <p className="text-emerald-400 font-bold">+${s.price}</p>
                          <p className="text-xs text-white/40">{s.buyer} • {formatDate(s.date)}</p>
                        </div>
                      </>
                    )}
                  </div>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-3xl mb-2">💰</p>
                    <p className="text-white/40 text-sm">Нет продаж</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tournaments Tab */}
          {activeTab === 'tournaments' && (
            <>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setTournamentFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tournamentFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Активные</button>
                <button onClick={() => setTournamentFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tournamentFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Завершённые</button>
              </div>
              {tournamentsLoading ? (
                <div className="text-center py-12">
                  <p className="text-white/40 text-sm">⏳ Загрузка...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRealTournaments.length > 0 ? filteredRealTournaments.map((t) => {
                    const opponentNames = t.opponents.map(o => o.username).join(', ') || '???';
                    const statusLabel = t.status === 'SEARCHING' ? 'Поиск' : t.status === 'IN_PROGRESS' ? 'В процессе' : t.status === 'DISPUTED' ? 'Спор' : t.status === 'CANCELLED' ? 'Отменён' : 'Завершён';
                    const isActive = t.status === 'SEARCHING' || t.status === 'IN_PROGRESS' || t.status === 'DISPUTED';
                    const borderColor = t.result === 'win' ? 'border-emerald-500/30' : t.result === 'loss' ? 'border-red-500/30' : t.status === 'DISPUTED' ? 'border-yellow-500/30' : 'border-slate-700/50';

                    return (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/messages/t-${t.id}`)}
                        className={`bg-slate-800/50 rounded-xl p-4 border ${borderColor} cursor-pointer hover:bg-slate-800/70 transition-all active:scale-[0.99]`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">TDM {t.teamMode === 'SOLO' ? '1 на 1' : '2 на 2'}</span>
                              {isActive ? (
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                                  t.status === 'DISPUTED' ? 'bg-red-500/20 text-red-400' :
                                  t.status === 'SEARCHING' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>{statusLabel}</span>
                              ) : t.result ? (
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                                  t.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>{t.result === 'win' ? '🏆 Победа' : 'Поражение'}</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-[10px] rounded-full">{statusLabel}</span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 truncate">vs {opponentNames}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-white/30">{formatDate(new Date(t.createdAt))}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/40">Ставка:</span>
                            <span className="text-xs text-yellow-400 font-medium">{t.bet} UC</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/40">Приз:</span>
                            <span className="text-xs text-emerald-400 font-medium">{t.prizePool} UC</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/40">Команд:</span>
                            <span className="text-xs text-white/60">{t.teamCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12">
                      <p className="text-3xl mb-2">🏆</p>
                      <p className="text-white/40 text-sm">Нет турниров</p>
                      <p className="text-white/30 text-xs mt-1">Создайте TDM матч на странице игры</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Clan Tab */}
          {activeTab === 'clan' && (
            <>
              {userClan ? (
                <>
                  <div className="bg-gradient-to-r from-red-900/30 to-slate-800/50 rounded-xl p-4 border border-red-500/20 mb-4">
                    <div className="flex items-center gap-3">
                      <img src={userClan.logo} alt={userClan.name} className="w-14 h-14 rounded-xl bg-slate-700" />
                      <div className="flex-1">
                        <p className="font-bold text-white">{userClan.name} <span className="text-red-400 text-sm">[{userClan.tag}]</span></p>
                        <p className="text-xs text-white/50">{userClan.members} участников • {userClan.floor} этаж башни</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          <span className="text-green-400">{userClan.wins}W</span> / <span className="text-red-400">{userClan.losses}L</span>
                        </p>
                      </div>
                      <button onClick={() => navigate('/clan')} className="px-3 py-2 bg-red-600/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-600/30 transition-colors">
                        Страница клана →
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setClanMatchFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${clanMatchFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Активные</button>
                    <button onClick={() => setClanMatchFilter('completed')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${clanMatchFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white/50 hover:text-white'}`}>Завершённые</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredClanMatches.length > 0 ? filteredClanMatches.map((m) => (
                      <div key={m.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 aspect-square flex flex-col items-center justify-center text-center">
                        <img src={m.opponentLogo} alt={m.opponent} className="w-12 h-12 rounded-xl bg-slate-700 mb-2" />
                        <p className="text-xs font-medium text-white truncate w-full">{m.opponent}</p>
                        <p className="text-xs text-white/40 mb-1">{formatDate(m.date)}</p>
                        {m.status === 'active' ? (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">Скоро</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {m.score}
                          </span>
                        )}
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-3xl mb-2">⚔️</p>
                        <p className="text-white/40 text-sm">Нет матчей</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
                  <p className="text-4xl mb-3">⚔️</p>
                  <p className="text-white/50 text-sm mb-4">Вы не состоите в клане</p>
                  <button onClick={() => navigate('/clan')} className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-500 transition-colors">
                    Найти клан
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowTopUp(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {showTopUp === 'money' ? '💳 Пополнить баланс' : '🎮 Пополнить UC'}
              </h2>
              <button onClick={() => setShowTopUp(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white/50 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {showTopUp === 'money' ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25, 50, 100, 200].map((amount) => (
                      <button key={amount} className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition-colors">${amount}</button>
                    ))}
                  </div>
                  <input type="number" placeholder="Другая сумма" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[60, 300, 600, 1500, 3000, 6000].map((uc) => (
                      <button key={uc} className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-yellow-400 font-semibold transition-colors">{uc} UC</button>
                    ))}
                  </div>
                </>
              )}
              <button className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${showTopUp === 'money' ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}>
                Пополнить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">⚙️ Настройки</h2>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-white/50 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>👤</span> Личные данные</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Никнейм</label>
                    <input type="text" defaultValue={userProfile.username} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Email</label>
                    <input type="email" defaultValue={userProfile.email} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Телефон</label>
                    <input type="tel" defaultValue={userProfile.phone} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>🌐</span> Язык и валюта</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Язык</label>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                      <option>🇷🇺 Русский</option>
                      <option>🇺🇦 Українська</option>
                      <option>🇬🇧 English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Валюта</label>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                      <option>$ USD</option>
                      <option>€ EUR</option>
                      <option>₴ UAH</option>
                      <option>₽ RUB</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>🔔</span> Уведомления</h3>
                <div className="space-y-2">
                  {[{ label: 'Турниры и матчи', enabled: true }, { label: 'Транзакции', enabled: true }, { label: 'Сообщения', enabled: true }, { label: 'Новости и акции', enabled: false }].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2">
                      <span className="text-sm text-white/70">{item.label}</span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${item.enabled ? 'bg-purple-600' : 'bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>🔒</span> Безопасность</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <span className="text-sm text-white">Сменить пароль</span>
                    <span className="text-white/30">→</span>
                  </button>
                  <button className="w-full flex items-center justify-between py-3 px-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <span className="text-sm text-white">Двухфакторная аутентификация</span>
                    <span className="text-xs text-yellow-400">Выкл</span>
                  </button>
                </div>
              </div>
              <button className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition-colors">Сохранить изменения</button>
              <button
                onClick={async () => { await logout(); setShowSettings(false); navigate('/', { replace: true }); }}
                className="w-full py-3 text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
