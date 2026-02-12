import { useState } from 'react';

interface Listing {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  seller: string;
  sellerAvatar: string;
  price: number;
  image: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  description: string;
  photos: number;
}

const categories = [
  { id: 'all', name: 'Все', icon: '📋' },
  { id: 'account', name: 'Аккаунты', icon: '🎮' },
  { id: 'costume', name: 'Костюмы', icon: '👗' },
  { id: 'car', name: 'Машины', icon: '🚗' },
  { id: 'boost', name: 'Буст', icon: '⚡' },
  { id: 'rental', name: 'Аренда', icon: '🔑' },
  { id: 'popularity', name: 'Популярность', icon: '⭐' },
  { id: 'metro', name: 'Метро', icon: '🔫' },
  { id: 'clan', name: 'Кланы', icon: '🛡️' },
  { id: 'home-votes', name: 'Голоса', icon: '🏠' },
];

const mockListings: Listing[] = Array.from({ length: 30 }, (_, i) => {
  const cats = ['account', 'costume', 'car', 'boost', 'rental', 'popularity', 'metro', 'clan', 'home-votes'];
  const catIdx = i % cats.length;
  const cat = cats[catIdx];
  const catInfo = categories.find(c => c.id === cat)!;
  const titles: Record<string, string[]> = {
    account: ['Аккаунт Lv.85 Glacier Max', 'Аккаунт Lv.60 с RP', 'Аккаунт Conqueror S5'],
    costume: ['Glacier Set', 'Pharaoh X-Suit', 'Blood Raven Set'],
    car: ['McLaren 570S', 'Lamborghini Open Top', 'Dacia Golden'],
    boost: ['Буст до Conqueror', 'Буст до Ace', 'Буст 100 очков'],
    rental: ['Аренда Lv.80 аккаунта', 'Аренда с Glacier', 'Аренда VIP аккаунта'],
    popularity: ['10K-50K ПП Машинки', '5K Сердечки', '20K Самолёты'],
    metro: ['M416 Полный комплект', 'Броня 3 уровня', 'Прицел 8x'],
    clan: ['Phoenix Rising Lv.10', 'Elite Squad Lv.8', 'Dragon Slayers Lv.7'],
    'home-votes': ['5000 голосов', '10000 голосов', '20000 голосов'],
  };
  const statuses: ('pending' | 'approved' | 'rejected')[] = i < 10 ? ['pending'] : i < 20 ? ['approved'] : ['rejected'];

  return {
    id: String(i + 1),
    category: cat,
    categoryIcon: catInfo.icon,
    title: titles[cat][i % 3],
    seller: ['ProGamer_X', 'TopSeller', 'SkinMaster', 'AccountKing', 'BoostPro'][i % 5],
    sellerAvatar: `https://picsum.photos/seed/lseller${i}/40/40`,
    price: [15, 45, 120, 250, 500, 900, 30, 80, 150, 350][i % 10],
    image: `https://picsum.photos/seed/listing${i + 1}/200/150`,
    status: statuses[0],
    createdAt: `${Math.floor(Math.random() * 24)} ч назад`,
    description: 'Описание объявления для модерации...',
    photos: 1 + Math.floor(Math.random() * 5),
  };
});

const AdminListingsPage = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = mockListings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = mockListings.filter(l => l.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-lg text-xs font-medium">На проверке</span>;
      case 'approved': return <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs font-medium">Одобрено</span>;
      case 'rejected': return <span className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded-lg text-xs font-medium">Отклонено</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Объявления</h1>
          <p className="text-zinc-500 text-sm mt-1">{pendingCount} на модерации</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'pending' ? `На проверке (${pendingCount})` : s === 'approved' ? 'Одобрено' : 'Отклонено'}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat.id ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Listings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(listing => (
          <div
            key={listing.id}
            onClick={() => setSelectedListing(listing)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all cursor-pointer"
          >
            <div className="aspect-[16/9] bg-zinc-800 relative">
              <img src={listing.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2">{getStatusBadge(listing.status)}</div>
              <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
                {listing.categoryIcon} {categories.find(c => c.id === listing.category)?.name}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium text-sm truncate flex-1 mr-2">{listing.title}</p>
                <span className="text-emerald-400 font-bold text-sm">${listing.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={listing.sellerAvatar} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-zinc-500 text-xs">{listing.seller}</span>
                </div>
                <span className="text-zinc-600 text-xs">{listing.createdAt}</span>
              </div>
              {listing.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={e => { e.stopPropagation(); }}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    ✓ Одобрить
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedListing(listing); }}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    ✕ Отклонить
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Listing detail modal */}
      {selectedListing && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => { setSelectedListing(null); setRejectReason(''); }} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[550px] md:max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Детали объявления</h2>
                <button onClick={() => { setSelectedListing(null); setRejectReason(''); }} className="text-zinc-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <img src={selectedListing.image} alt="" className="w-full aspect-video rounded-xl object-cover" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Категория</span>
                  <span className="text-white text-sm">{selectedListing.categoryIcon} {categories.find(c => c.id === selectedListing.category)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Название</span>
                  <span className="text-white text-sm font-medium">{selectedListing.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Цена</span>
                  <span className="text-emerald-400 font-bold">${selectedListing.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Продавец</span>
                  <div className="flex items-center gap-2">
                    <img src={selectedListing.sellerAvatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-white text-sm">{selectedListing.seller}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Фото</span>
                  <span className="text-white text-sm">{selectedListing.photos} шт</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Статус</span>
                  {getStatusBadge(selectedListing.status)}
                </div>
                <div>
                  <span className="text-zinc-500 text-sm">Описание</span>
                  <p className="text-white text-sm mt-1 bg-zinc-800/50 rounded-xl p-3">{selectedListing.description}</p>
                </div>
              </div>

              {selectedListing.status === 'pending' && (
                <div className="space-y-3 pt-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Причина отклонения (если отклоняете)..."
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                      ✓ Одобрить
                    </button>
                    <button className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">
                      ✕ Отклонить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminListingsPage;
