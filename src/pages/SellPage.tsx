import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ============ TYPES ============
type SellCategory = 'accounts' | 'costumes' | 'cars' | 'popularity' | 'metro' | 'home-votes' | 'clan' | 'rental' | 'boost';

interface FormField {
  key: string;
  label: string;
  hint?: string;
  type: 'text' | 'number' | 'textarea' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FormStep {
  title: string;
  fields: FormField[];
}

// ============ ACCOUNTS FLOW STEPS ============
type AccountStep = 'photos' | 'info' | 'contents' | 'price' | 'confirm' | 'listing-type';
const ACCOUNT_STEPS: AccountStep[] = ['photos', 'info', 'contents', 'price', 'confirm', 'listing-type'];
const ACCOUNT_STEP_LABELS: Record<AccountStep, string> = {
  photos: 'Фотографии',
  info: 'Основная информация',
  contents: 'Содержимое аккаунта',
  price: 'Цена',
  confirm: 'Подтверждение',
  'listing-type': 'Тип размещения',
};

// ============ CATEGORIES ============
const sellCategories: { id: SellCategory; name: string }[] = [
  { id: 'accounts', name: 'Аккаунт' },
  { id: 'costumes', name: 'Костюм' },
  { id: 'cars', name: 'Машина' },
  { id: 'popularity', name: 'Популярность' },
  { id: 'metro', name: 'Метро Рояль' },
  { id: 'home-votes', name: 'Голоса дома' },
  { id: 'clan', name: 'Клан' },
  { id: 'rental', name: 'Аренда аккаунта' },
  { id: 'boost', name: 'Буст' },
];

// ============ DELIVERY TIME OPTIONS ============
const DELIVERY_TIME_OPTIONS: { value: string; label: string }[] = [
  { value: '5', label: '5 минут' },
  { value: '10', label: '10 минут' },
  { value: '15', label: '15 минут' },
  { value: '20', label: '20 минут' },
  { value: '30', label: '30 минут' },
  { value: '45', label: '45 минут' },
  { value: '60', label: '1 час' },
  { value: '120', label: '2 часа' },
  { value: '180', label: '3 часа' },
  { value: '240', label: '4 часа' },
  { value: '360', label: '6 часов' },
  { value: '480', label: '8 часов' },
  { value: '720', label: '12 часов' },
  { value: '1440', label: '24 часа' },
];

// ============ FIELD BLOCKS PER CATEGORY (non-accounts) ============
const getCategorySteps = (category: SellCategory): FormStep[] => {
  switch (category) {
    case 'accounts':
      return []; // accounts handled by custom flow
    case 'costumes':
      return [
        { title: 'Информация о костюме', fields: [
          { key: 'itemName', label: 'Название костюма', type: 'text', required: true, placeholder: 'Например: Glacier Set', hint: 'Точное название из игры — видно на карточке и в деталях' },
        ]},
        { title: 'Время доставки', fields: [
          { key: 'deliveryTimeMin', label: 'Минимальное время доставки', type: 'select', required: true, hint: 'Минимальное время доставки после оплаты (от 5 минут)', options: DELIVERY_TIME_OPTIONS },
          { key: 'deliveryTimeMax', label: 'Максимальное время доставки', type: 'select', required: true, hint: 'Максимальное время доставки (до 24 часов)', options: DELIVERY_TIME_OPTIONS },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Цена ($)', type: 'number', required: true, placeholder: 'Например: 85', hint: 'Цена которую увидит покупатель' },
        ]},
      ];
    case 'cars':
      return [
        { title: 'Информация о транспорте', fields: [
          { key: 'itemName', label: 'Название транспорта', type: 'text', required: true, placeholder: 'Например: McLaren 570S', hint: 'Точное название из игры — видно на карточке' },
          { key: 'description', label: 'Описание транспорта', type: 'textarea', required: true, placeholder: 'Спортивный суперкар с уникальным дизайном и эффектами', hint: 'Покупатель увидит это описание при открытии карточки' },
        ]},
        { title: 'Доставка', fields: [
          { key: 'deliveryTime', label: 'Время доставки', type: 'select', required: true, hint: 'За сколько вы отправите подарок покупателю после оплаты', options: [
            { value: '5 мин', label: '5 минут' },
            { value: '10 мин', label: '10 минут' },
            { value: '15 мин', label: '15 минут' },
            { value: '30 мин', label: '30 минут' },
            { value: '1 час', label: '1 час' },
            { value: '2 часа', label: '2 часа' },
          ]},
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Цена ($)', type: 'number', required: true, placeholder: 'Например: 180', hint: 'Цена которую увидит покупатель' },
        ]},
      ];
    case 'popularity':
      return [
        { title: 'Тип популярности', fields: [
          { key: 'popularityType', label: 'Тип популярности', type: 'select', required: true, hint: 'Какой тип очков популярности вы предлагаете', options: [
            { value: 'cars', label: '🚗 Машинки' },
            { value: 'planes', label: '✈️ Самолёты' },
            { value: 'hearts', label: '❤️ Сердечки' },
            { value: 'flowers', label: '🌸 Цветы' },
            { value: 'bears', label: '🧸 Мишки' },
            { value: 'diamonds', label: '💎 Алмазы' },
          ]},
        ]},
        { title: 'Объём и доступность', fields: [
          { key: 'amountMin', label: 'Минимальный объём (ПП)', type: 'number', required: true, placeholder: 'Например: 10000', hint: 'Минимальное количество популярности за заказ' },
          { key: 'amountMax', label: 'Максимальный объём (ПП)', type: 'number', required: true, placeholder: 'Например: 50000', hint: 'Максимальное количество за один заказ' },
          { key: 'availableFrom', label: 'Работаю с', type: 'text', required: true, placeholder: 'Например: 10:00', hint: 'Время начала работы (покупатель увидит ваши рабочие часы)' },
          { key: 'availableTo', label: 'Работаю до', type: 'text', required: true, placeholder: 'Например: 22:00', hint: 'Время окончания работы' },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Общая цена ($)', type: 'number', required: true, placeholder: 'Например: 25', hint: 'Общая стоимость за максимальный объём — видна на карточке' },
          { key: 'pricePerUnit', label: 'Цена за 1000 ПП ($)', type: 'number', required: true, placeholder: 'Например: 0.50', hint: 'Цена за 1000 очков популярности — видна на карточке' },
        ]},
      ];
    case 'metro':
      return [
        { title: 'Информация о предмете', fields: [
          { key: 'itemName', label: 'Название предмета', type: 'text', required: true, placeholder: 'Например: M416 Полный комплект', hint: 'Точное название — видно на карточке в списке' },
          { key: 'metroType', label: 'Категория предмета', type: 'select', required: true, hint: 'Покупатели смогут фильтровать по этой категории', options: [
            { value: 'weapon-sets', label: 'Комплекты оружия' },
            { value: 'armor', label: 'Броня' },
            { value: 'attachments', label: 'Обвесы' },
            { value: 'consumables', label: 'Расходники' },
            { value: 'letters', label: 'Письма' },
            { value: 'backpacks', label: 'Рюкзаки' },
            { value: 'other', label: 'Другое' },
          ]},
        ]},
        { title: 'Описание', fields: [
          { key: 'description', label: 'Описание предмета', type: 'textarea', required: true, placeholder: 'Тактический обвес + глушитель для M416', hint: 'Подробное описание — покупатель увидит его при открытии карточки' },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Цена ($)', type: 'number', required: true, placeholder: 'Например: 15', hint: 'Цена которую увидит покупатель' },
        ]},
      ];
    case 'home-votes':
      return [
        { title: 'Объём голосов', fields: [
          { key: 'amountMin', label: 'Минимальный объём голосов', type: 'number', required: true, placeholder: 'Например: 200', hint: 'Минимальное количество голосов за заказ' },
          { key: 'amountMax', label: 'Максимальный объём голосов', type: 'number', required: true, placeholder: 'Например: 5000', hint: 'Максимальное количество за один заказ' },
        ]},
        { title: 'Описание', fields: [
          { key: 'description', label: 'Описание услуги', type: 'textarea', required: true, placeholder: 'Например: Премиум пакет — быстрая накрутка голосов', hint: 'Короткое описание — видно покупателю при открытии карточки' },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Общая цена ($)', type: 'number', required: true, placeholder: 'Например: 12', hint: 'Итоговая цена за максимальный объём — видна на карточке' },
          { key: 'pricePerUnit', label: 'Цена за 100 голосов ($)', type: 'number', required: true, placeholder: 'Например: 0.40', hint: 'Цена за 100 голосов — видна на карточке рядом с объёмом' },
        ]},
      ];
    case 'clan':
      return [
        { title: 'Информация о клане', fields: [
          { key: 'clanName', label: 'Название клана', type: 'text', required: true, placeholder: 'Например: Phoenix Rising', hint: 'Точное название из игры — видно на карточке' },
          { key: 'clanLevel', label: 'Уровень клана', type: 'number', required: true, placeholder: 'Например: 7', hint: 'От 1 до 10 — видно на карточке рядом с названием' },
        ]},
        { title: 'Описание', fields: [
          { key: 'description', label: 'Описание клана', type: 'textarea', required: true, placeholder: 'Активный клан, ежедневные турниры, 45 участников...', hint: 'Расскажите о клане — покупатель увидит это при открытии карточки' },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Цена ($)', type: 'number', required: true, placeholder: 'Например: 50', hint: 'Цена которую увидит покупатель' },
        ]},
      ];
    case 'rental':
      return [
        { title: 'Аккаунт для аренды', fields: [
          { key: 'collectionLevel', label: 'Уровень коллекции', type: 'number', required: true, placeholder: 'Например: 72', hint: 'Число из профиля — покупатель видит его на карточке и в фильтрах' },
          { key: 'description', label: 'Описание аккаунта', type: 'textarea', required: true, placeholder: 'Премиум аккаунт, все RP с 1 сезона, Glacier M416', hint: 'Короткое описание — видно на карточке аренды' },
        ]},
        { title: 'Стоимость аренды', fields: [
          { key: 'pricePerHour', label: 'Цена за час ($)', type: 'number', required: true, placeholder: 'Например: 0.80', hint: 'Сколько стоит 1 час аренды — покупатель видит это на карточке' },
          { key: 'minHours', label: 'Минимальный срок (часов)', type: 'number', required: true, placeholder: 'Например: 2', hint: 'Минимальное количество часов аренды' },
        ]},
        { title: 'Условия аренды', fields: [
          { key: 'rentalTerms', label: 'Правила аренды', type: 'textarea', required: true, placeholder: '• Не менять пароль и привязки\n• Не удалять друзей и клан\n• Не тратить UC и валюту\n• После аренды выйти из аккаунта', hint: 'Покупатель увидит эти правила перед арендой' },
        ]},
      ];
    case 'boost':
      return [
        { title: 'Ваш профиль бустера', fields: [
          { key: 'boostNickname', label: 'Игровой никнейм', type: 'text', required: true, placeholder: 'Например: ProBooster_X', hint: 'Ваш ник в игре — покупатель увидит его на карточке' },
          { key: 'platform', label: 'Платформа', type: 'select', required: true, hint: 'На какой платформе вы буститe', options: [
            { value: 'any', label: 'Любая платформа' },
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iOS' },
          ]},
        ]},
        { title: 'Описание услуги', fields: [
          { key: 'shortDesc', label: 'Краткое описание', type: 'text', required: true, placeholder: 'Например: Топ-бустер, 500+ заказов', hint: 'Одна строка — видно на карточке в списке бустеров' },
          { key: 'fullDesc', label: 'Полное описание', type: 'textarea', required: true, placeholder: 'Опыт 4+ года, работаю 24/7, безопасные методы, использую VPN вашего региона...', hint: 'Подробное описание — покупатель увидит при открытии вашего профиля' },
        ]},
        { title: 'Цена', fields: [
          { key: 'price', label: 'Базовая цена за 100 очков ($)', type: 'number', required: true, placeholder: 'Например: 5.00', hint: 'Стоимость буста на 100 рейтинговых очков — видна покупателю' },
        ]},
      ];
  }
};

// ============ COMPONENT ============
const SellPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Shared state ----
  const [revealedStep, setRevealedStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<SellCategory | ''>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [listingType, setListingType] = useState<'paid' | 'free'>('paid');
  const [submitted, setSubmitted] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const [genericPhase, setGenericPhase] = useState<'filling' | 'confirm'>('filling');
  const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);

  // ---- Accounts-specific state ----
  const [accStep, setAccStep] = useState<number>(0); // index into ACCOUNT_STEPS
  const [accCostumes, setAccCostumes] = useState<string[]>(['']);
  const [accCars, setAccCars] = useState<string[]>(['']);
  const [accWeapons, setAccWeapons] = useState<string[]>(['']);
  const [accOther, setAccOther] = useState<string[]>(['']);

  const isAccounts = selectedCategory === 'accounts';
  const currentAccStep = ACCOUNT_STEPS[accStep] as AccountStep | undefined;

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    if (catDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catDropdownOpen]);

  // Close select dropdowns on click outside
  useEffect(() => {
    if (!openSelectKey) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-select-dropdown]')) setOpenSelectKey(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openSelectKey]);

  const categorySteps = useMemo(() => {
    if (!selectedCategory || isAccounts) return [];
    return getCategorySteps(selectedCategory);
  }, [selectedCategory, isAccounts]);

  // ---- Reset everything ----
  const resetAll = useCallback(() => {
    setSubmitted(false);
    setRevealedStep(0);
    setSelectedCategory('');
    setFormData({});
    setPhotos([]);
    setPhotoPreviews([]);
    setListingType('paid');
    setErrors({});
    setGenericPhase('filling');
    setOpenSelectKey(null);
    setAccStep(0);
    setAccCostumes(['']);
    setAccCars(['']);
    setAccWeapons(['']);
    setAccOther(['']);
  }, []);

  // When category changes
  const handleCategoryChange = (value: string) => {
    if (value) {
      setSelectedCategory(value as SellCategory);
      setRevealedStep(1);
      setFormData({});
      setPhotos([]);
      setPhotoPreviews([]);
      setErrors({});
      setGenericPhase('filling');
      setOpenSelectKey(null);
      setAccStep(0);
      setAccCostumes(['']);
      setAccCars(['']);
      setAccWeapons(['']);
      setAccOther(['']);
    }
  };

  // Update form field
  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  // Photo upload (shared)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const maxPhotos = isAccounts ? 10 : selectedCategory === 'costumes' ? 1 : 10;
    const allowed = files.slice(0, maxPhotos - photos.length);
    if (allowed.length === 0) return;
    setPhotos(prev => [...prev, ...allowed]);
    setPhotoPreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (errors._photos) {
      setErrors(prev => { const n = { ...prev }; delete n._photos; return n; });
    }
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ---- Accounts validation per step ----
  const validateAccStep = (): boolean => {
    const step = ACCOUNT_STEPS[accStep];
    const newErrors: Record<string, string> = {};

    if (step === 'photos') {
      if (photos.length < 2) {
        newErrors._photos = 'Загрузите минимум 2 фотографии аккаунта';
        setErrors(newErrors);
        return false;
      }
    }

    if (step === 'info') {
      if (!formData.description?.trim()) newErrors.description = 'Заполните это поле';
      if (!formData.accountLevel?.trim()) newErrors.accountLevel = 'Заполните это поле';
      else {
        const lvl = parseInt(formData.accountLevel);
        if (isNaN(lvl) || lvl < 1) newErrors.accountLevel = 'Введите корректный уровень';
      }
      if (!formData.collectionLevel?.trim()) newErrors.collectionLevel = 'Заполните это поле';
      else {
        const lvl = parseInt(formData.collectionLevel);
        if (isNaN(lvl) || lvl < 0) newErrors.collectionLevel = 'Введите корректное число';
      }
    }

    if (step === 'contents') {
      if (!formData.rpSeasons?.trim()) newErrors.rpSeasons = 'Укажите хотя бы один RP сезон';
      const filledCostumes = accCostumes.filter(c => c.trim());
      const filledCars = accCars.filter(c => c.trim());
      const filledWeapons = accWeapons.filter(c => c.trim());
      const filledOther = accOther.filter(c => c.trim());
      // All sections required, min 5 each
      if (filledCostumes.length < 5) newErrors._costumes = filledCostumes.length === 0 ? 'Добавьте минимум 5 редких костюмов' : `Минимум 5 костюмов (сейчас ${filledCostumes.length})`;
      if (filledCars.length < 5) newErrors._cars = filledCars.length === 0 ? 'Добавьте минимум 5 редкого транспорта' : `Минимум 5 транспорта (сейчас ${filledCars.length})`;
      if (filledWeapons.length < 5) newErrors._weapons = filledWeapons.length === 0 ? 'Добавьте минимум 5 редкого оружия' : `Минимум 5 скинов оружия (сейчас ${filledWeapons.length})`;
      if (filledOther.length < 5) newErrors._other = filledOther.length === 0 ? 'Добавьте минимум 5 редких предметов' : `Минимум 5 предметов (сейчас ${filledOther.length})`;
    }

    if (step === 'price') {
      if (!formData.price?.trim()) newErrors.price = 'Укажите цену';
      else {
        const p = parseFloat(formData.price);
        if (isNaN(p) || p < 50) newErrors.price = 'Минимальная цена аккаунта — $50';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const advanceAccStep = () => {
    if (!validateAccStep()) return;
    setAccStep(prev => prev + 1);
  };

  // ---- Generic validation for non-accounts ----
  const validateBlock = (blockIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (blockIndex === 1) {
      // Photo validation
      if (selectedCategory === 'costumes') {
        if (photos.length !== 1) {
          newErrors._photos = 'Загрузите ровно 1 фото костюма';
          setErrors(newErrors);
          return false;
        }
      }
      return true;
    }

    const stepIndex = blockIndex - 2;
    if (stepIndex >= 0 && stepIndex < categorySteps.length) {
      for (const field of categorySteps[stepIndex].fields) {
        const value = formData[field.key] || '';
        if (field.required && !value.trim()) {
          newErrors[field.key] = 'Заполните это поле';
        }
        if (field.type === 'number' && value.trim()) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) newErrors[field.key] = 'Введите корректное число';
          if (field.key.includes('price') && num <= 0) newErrors[field.key] = 'Цена должна быть больше 0';
        }
      }
      // Cross-field: delivery time range for costumes
      if (selectedCategory === 'costumes') {
        const minT = parseInt(formData.deliveryTimeMin || '0');
        const maxT = parseInt(formData.deliveryTimeMax || '0');
        if (minT > 0 && maxT > 0 && minT > maxT) {
          newErrors.deliveryTimeMax = 'Максимальное время должно быть ≥ минимального';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const advanceFrom = (blockIndex: number) => {
    if (!validateBlock(blockIndex)) return;
    const lastBlock = categorySteps.length + 1;
    if (blockIndex === lastBlock) {
      // Last step (price) completed — go to confirmation
      setGenericPhase('confirm');
    } else {
      setRevealedStep(prev => Math.max(prev, blockIndex + 1));
    }
  };

  // ---- Listing price ----
  const getListingPrice = (): number => {
    if (selectedCategory === 'rental') return parseFloat(formData.pricePerHour || '0') * parseFloat(formData.minHours || '1');
    return parseFloat(formData.price || '0');
  };
  const listingFee = getListingPrice() * 0.02;

  const handleSubmit = () => setSubmitted(true);

  const getCategoryName = () => sellCategories.find(c => c.id === selectedCategory)?.name || '';

  // ---- Render helpers ----
  const renderField = (field: FormField) => {
    const value = formData[field.key] || '';
    const error = errors[field.key];
    const borderColor = error ? 'border-red-500' : 'border-zinc-700';
    const base = `w-full bg-zinc-800 border ${borderColor} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`;

    return (
      <div key={field.key} className="space-y-1.5">
        <label className="block text-sm font-medium text-white">
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {field.hint && <p className="text-xs text-zinc-500 leading-tight">{field.hint}</p>}

        {field.type === 'text' && (
          <input type="text" value={value} onChange={e => updateField(field.key, e.target.value)} placeholder={field.placeholder} className={base} />
        )}
        {field.type === 'number' && (
          <input type="number" value={value} onChange={e => updateField(field.key, e.target.value)} placeholder={field.placeholder} min="0" step="0.01" className={base} />
        )}
        {field.type === 'textarea' && (
          <textarea value={value} onChange={e => updateField(field.key, e.target.value)} placeholder={field.placeholder} rows={3} className={`w-full bg-zinc-800 border ${borderColor} rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none`} />
        )}
        {field.type === 'select' && field.options && (
          <div className="relative" data-select-dropdown>
            <button
              type="button"
              onClick={() => setOpenSelectKey(openSelectKey === field.key ? null : field.key)}
              className={`w-full bg-zinc-800 border ${openSelectKey === field.key ? 'border-purple-500' : error ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-sm text-left flex items-center justify-between transition-colors cursor-pointer ${value ? 'text-white' : 'text-zinc-500'}`}
            >
              <span>{value ? field.options.find(o => o.value === value)?.label : 'Выберите...'}</span>
              <svg className={`w-5 h-5 text-zinc-400 transition-transform ${openSelectKey === field.key ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSelectKey === field.key && (
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl shadow-black/40 max-h-60 overflow-y-auto">
                {field.options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { updateField(field.key, opt.value); setOpenSelectKey(null); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      value === opt.value
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-zinc-300 hover:bg-zinc-700/60 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  };

  // Reusable add/remove list section
  const renderListSection = (
    label: string,
    hint: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string,
    required: boolean,
    errorKey: string,
    minItems: number = 5,
  ) => {
    const filledCount = items.filter(c => c.trim()).length;
    const hasAny = filledCount > 0;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-white">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <span className={`text-xs font-medium ${filledCount >= minItems ? 'text-emerald-400' : filledCount > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
            {filledCount} / {minItems} мин.
          </span>
        </div>
        <p className="text-xs text-zinc-500 leading-tight">{hint}</p>
        {hasAny && filledCount < minItems && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <span className="text-amber-400 text-xs mt-0.5">!</span>
            <p className="text-xs text-amber-300 leading-snug">
              Раздел начат — нужно минимум {minItems} предметов. Заполните до конца или очистите раздел.
            </p>
          </div>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              value={item}
              onChange={e => {
                const next = [...items];
                next[idx] = e.target.value;
                setItems(next);
                if (errors[errorKey]) setErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
              }}
              placeholder={placeholder}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 h-[42px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setItems(prev => [...prev, ''])}
            className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
          >
            + Добавить ещё
          </button>
          {hasAny && !required && (
            <button
              type="button"
              onClick={() => { setItems(['']); if (errors[errorKey]) setErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; }); }}
              className="text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors"
            >
              Очистить раздел
            </button>
          )}
        </div>
        {errors[errorKey] && <p className="text-xs text-red-400">{errors[errorKey]}</p>}
      </div>
    );
  };

  // ============ SUCCESS STATE ============
  if (submitted) {
    return (
      <div className="min-h-screen pb-44 relative">
        <div className="hidden character:block fixed right-0 bottom-0 z-10 pointer-events-none">
          <img src="/Продать.png" alt="" className="h-[95vh] w-auto object-contain translate-y-[-30px]" />
        </div>
        <main className="max-w-[1800px] mx-auto px-4 md:px-8 pt-6 character:pr-[580px]">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Объявление отправлено!</h1>
            <p className="text-zinc-400 text-sm mb-1">
              {getCategoryName()} — {listingType === 'paid' ? 'платное размещение' : 'бесплатное размещение'}
            </p>
            <p className="text-zinc-500 text-xs mb-8">Будет проверено модератором и опубликовано в течение 24 часов.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={resetAll} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                Продать ещё
              </button>
              <button onClick={() => navigate('/profile')} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors">
                Мой профиль
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============ ACCOUNTS CUSTOM FLOW ============
  if (isAccounts) {
    const stepNum = accStep + 1;
    const totalSteps = ACCOUNT_STEPS.length;
    const stepLabel = currentAccStep ? ACCOUNT_STEP_LABELS[currentAccStep] : '';
    const costumesFiltered = accCostumes.filter(c => c.trim());
    const carsFiltered = accCars.filter(c => c.trim());
    const weaponsFiltered = accWeapons.filter(c => c.trim());
    const otherFiltered = accOther.filter(c => c.trim());

    return (
      <div className="min-h-screen pb-44 relative">
        <div className="hidden character:block fixed right-0 bottom-0 z-10 pointer-events-none">
          <img src="/Продать.png" alt="" className="h-[95vh] w-auto object-contain translate-y-[-30px]" />
        </div>

        <main className="max-w-[1800px] mx-auto px-4 md:px-8 pt-6 character:pr-[580px]">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Продать аккаунт</h1>
            <p className="text-zinc-400 text-sm">Заполните все шаги для публикации аккаунта</p>
          </div>

          <div className="max-w-2xl space-y-5">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Шаг {stepNum} из {totalSteps}</span>
                <span className="text-white font-medium">{stepLabel}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(stepNum / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* ===== STEP: PHOTOS ===== */}
            {currentAccStep === 'photos' && (
              <div className="space-y-3 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-white">Фотографии аккаунта <span className="text-red-400">*</span></h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Скриншоты из PUBG Mobile: инвентарь, профиль, RP, коллекции. Минимум 2, максимум 10.
                  </p>
                </div>

                {photoPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-600 group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Загружено: {photos.length} / 10</span>
                  {photos.length < 2 && <span className="text-amber-400">Нужно ещё {2 - photos.length}</span>}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                {photos.length < 10 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-xl text-zinc-400 hover:text-zinc-300 text-sm transition-colors">
                    + Добавить фото
                  </button>
                )}
                {errors._photos && <p className="text-xs text-red-400">{errors._photos}</p>}

                <button type="button" onClick={advanceAccStep}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors mt-1">
                  Далее
                </button>
              </div>
            )}

            {/* ===== STEP: INFO ===== */}
            {currentAccStep === 'info' && (
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Основная информация</h3>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">Краткое название <span className="text-red-400">*</span></label>
                  <p className="text-xs text-zinc-500 leading-tight">Видно на карточке в списке аккаунтов</p>
                  <input type="text" value={formData.description || ''} onChange={e => updateField('description', e.target.value)}
                    placeholder="Например: Аккаунт с Glacier M416"
                    className={`w-full bg-zinc-800 border ${errors.description ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`} />
                  {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
                </div>

                {/* Account Level */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">Уровень аккаунта (Account Level) <span className="text-red-400">*</span></label>
                  <p className="text-xs text-zinc-500 leading-tight">Число из профиля — отображается на карточке и в окне покупки</p>
                  <input type="number" value={formData.accountLevel || ''} onChange={e => updateField('accountLevel', e.target.value)}
                    placeholder="Например: 75" min="1"
                    className={`w-full bg-zinc-800 border ${errors.accountLevel ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`} />
                  {errors.accountLevel && <p className="text-xs text-red-400">{errors.accountLevel}</p>}
                </div>

                {/* Collection Level */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">Уровень коллекции <span className="text-red-400">*</span></label>
                  <p className="text-xs text-zinc-500 leading-tight">Наполненность аккаунта предметами — видно в карточке и фильтрах</p>
                  <input type="number" value={formData.collectionLevel || ''} onChange={e => updateField('collectionLevel', e.target.value)}
                    placeholder="Например: 45" min="0"
                    className={`w-full bg-zinc-800 border ${errors.collectionLevel ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`} />
                  {errors.collectionLevel && <p className="text-xs text-red-400">{errors.collectionLevel}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAccStep(prev => prev - 1)}
                    className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                    Назад
                  </button>
                  <button type="button" onClick={advanceAccStep}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP: CONTENTS ===== */}
            {currentAccStep === 'contents' && (
              <div className="space-y-5 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Содержимое аккаунта</h3>
                <p className="text-xs text-zinc-500 -mt-3">Эти данные автоматически отобразятся покупателю в окне аккаунта по категориям</p>

                {/* RP Seasons */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">RP сезоны <span className="text-red-400">*</span></label>
                  <p className="text-xs text-zinc-500 leading-tight">Перечислите через запятую все RP сезоны</p>
                  <input type="text" value={formData.rpSeasons || ''} onChange={e => updateField('rpSeasons', e.target.value)}
                    placeholder="Например: S14, S15, S16, A1, A2, A3"
                    className={`w-full bg-zinc-800 border ${errors.rpSeasons ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`} />
                  {errors.rpSeasons && <p className="text-xs text-red-400">{errors.rpSeasons}</p>}
                </div>

                {/* Costumes */}
                {renderListSection(
                  'Редкие костюмы', 'Только редкие / Mythic / Legendary костюмы. Обычные костюмы не добавляйте.',
                  accCostumes, setAccCostumes, 'Например: Glacier Suit, Pharaoh X-Suit', true, '_costumes', 5
                )}

                {/* Cars */}
                {renderListSection(
                  'Редкий транспорт', 'Только редкие / Mythic / Legendary машины и транспорт. Обычный транспорт не добавляйте.',
                  accCars, setAccCars, 'Например: McLaren 570S, Koenigsegg', true, '_cars', 5
                )}

                {/* Weapons */}
                {renderListSection(
                  'Редкое оружие', 'Только редкие / Mythic / Legendary скины оружия. Обычное оружие не добавляйте.',
                  accWeapons, setAccWeapons, 'Например: M416 Glacier, AKM The Golden', true, '_weapons', 5
                )}

                {/* Other */}
                {renderListSection(
                  'Другое (редкое)', 'Редкие парашюты, рюкзаки, шлемы, Kill Messages, эмоции и т.д.',
                  accOther, setAccOther, 'Например: Golden Wings Parachute', true, '_other', 5
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAccStep(prev => prev - 1)}
                    className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                    Назад
                  </button>
                  <button type="button" onClick={advanceAccStep}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP: PRICE ===== */}
            {currentAccStep === 'price' && (
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Цена аккаунта</h3>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">Цена ($) <span className="text-red-400">*</span></label>
                  <p className="text-xs text-zinc-500 leading-tight">Минимальная цена аккаунта — $50. Эту цену увидит покупатель на карточке.</p>
                  <input type="number" value={formData.price || ''} onChange={e => updateField('price', e.target.value)}
                    placeholder="Например: 150" min="50" step="1"
                    className={`w-full bg-zinc-800 border ${errors.price ? 'border-red-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors`} />
                  {errors.price && <p className="text-xs text-red-400">{errors.price}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAccStep(prev => prev - 1)}
                    className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                    Назад
                  </button>
                  <button type="button" onClick={advanceAccStep}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                    Далее
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP: CONFIRMATION ===== */}
            {currentAccStep === 'confirm' && (
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Проверьте данные перед публикацией</h3>

                {/* Photos preview */}
                <div className="space-y-1.5">
                  <span className="text-xs text-zinc-400 font-medium">Фотографии ({photos.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-800/60 rounded-lg p-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Название</span>
                    <p className="text-white text-sm mt-0.5">{formData.description}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-lg p-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Цена</span>
                    <p className="text-emerald-400 text-sm font-bold mt-0.5">${formData.price}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-lg p-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Уровень аккаунта</span>
                    <p className="text-white text-sm mt-0.5">{formData.accountLevel}</p>
                  </div>
                  <div className="bg-zinc-800/60 rounded-lg p-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Уровень коллекции</span>
                    <p className="text-white text-sm mt-0.5">{formData.collectionLevel}</p>
                  </div>
                </div>

                {/* Contents summary */}
                <div className="space-y-2">
                  <span className="text-xs text-zinc-400 font-medium">Содержимое аккаунта</span>
                  <div className="bg-zinc-800/60 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-zinc-500 text-xs">RP сезоны:</span>
                      <p className="text-white">{formData.rpSeasons}</p>
                    </div>
                    {costumesFiltered.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Костюмы ({costumesFiltered.length}):</span>
                        <p className="text-white">{costumesFiltered.join(', ')}</p>
                      </div>
                    )}
                    {carsFiltered.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Транспорт ({carsFiltered.length}):</span>
                        <p className="text-white">{carsFiltered.join(', ')}</p>
                      </div>
                    )}
                    {weaponsFiltered.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Оружие ({weaponsFiltered.length}):</span>
                        <p className="text-white">{weaponsFiltered.join(', ')}</p>
                      </div>
                    )}
                    {otherFiltered.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Другое ({otherFiltered.length}):</span>
                        <p className="text-white">{otherFiltered.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAccStep(prev => prev - 1)}
                    className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                    Назад
                  </button>
                  <button type="button" onClick={advanceAccStep}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                    Всё верно, далее
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP: LISTING TYPE ===== */}
            {currentAccStep === 'listing-type' && (
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Тип размещения</h3>

                <button type="button" onClick={() => setListingType('paid')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    listingType === 'paid' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">Платное размещение</span>
                    <span className="text-emerald-400 font-bold text-sm">${(parseFloat(formData.price || '0') * 0.02).toFixed(2)}</span>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    <li>• 2% от цены аккаунта</li>
                    <li>• Приоритет в списке</li>
                    <li>• Повышенное доверие покупателей</li>
                    <li>• Приоритетная поддержка</li>
                  </ul>
                </button>

                <button type="button" onClick={() => setListingType('free')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    listingType === 'free' ? 'border-zinc-500 bg-zinc-700/20' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  }`}>
                  <span className="text-white font-semibold text-sm">Бесплатное размещение</span>
                  <p className="text-xs text-zinc-500 mt-1">
                    Вы можете разместить товар бесплатно, но платный статус поможет продать его быстрее и выгоднее.
                  </p>
                </button>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAccStep(prev => prev - 1)}
                    className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                    Назад
                  </button>
                  <button type="button" onClick={handleSubmit}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all">
                    Опубликовать
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ============ GENERIC FLOW (non-accounts) ============
  const isCostume = selectedCategory === 'costumes';
  const maxGenericPhotos = isCostume ? 1 : 10;

  // Helper: get display value for a select field
  const getFieldDisplay = (field: FormField): string => {
    const val = formData[field.key] || '';
    if (!val) return '—';
    if (field.type === 'select' && field.options) {
      return field.options.find(o => o.value === val)?.label || val;
    }
    if (field.key.includes('price') || field.key.includes('Price')) return `$${val}`;
    return val;
  };

  return (
    <div className="min-h-screen pb-44 relative">
      <div className="hidden character:block fixed right-0 bottom-0 z-10 pointer-events-none">
        <img src="/Продать.png" alt="" className="h-[95vh] w-auto object-contain translate-y-[-30px]" />
      </div>

      <main className="max-w-[1800px] mx-auto px-4 md:px-8 pt-6 character:pr-[580px]">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Продать</h1>
          <p className="text-zinc-400 text-sm">Выставь товар или услугу на продажу</p>
        </div>

        <div className="max-w-2xl space-y-5">

          {/* ============ FILLING PHASE ============ */}
          {genericPhase === 'filling' && (
            <>
              {/* ===== GAME + CATEGORY ===== */}
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Игра</label>
                  <div className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 h-[46px] flex items-center text-white/70 text-sm">
                    PUBG Mobile
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-white">
                    Категория <span className="text-red-400">*</span>
                  </label>
                  <div className="relative" ref={catDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCatDropdownOpen(prev => !prev)}
                      className={`w-full bg-zinc-800 border ${catDropdownOpen ? 'border-purple-500' : 'border-zinc-700'} rounded-xl px-4 h-[46px] text-sm text-left flex items-center justify-between transition-colors cursor-pointer ${selectedCategory ? 'text-white' : 'text-zinc-500'}`}
                    >
                      <span>{selectedCategory ? sellCategories.find(c => c.id === selectedCategory)?.name : 'Выберите категорию...'}</span>
                      <svg className={`w-5 h-5 text-zinc-400 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {catDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl shadow-black/40">
                        {sellCategories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => { handleCategoryChange(cat.id); setCatDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              selectedCategory === cat.id
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'text-zinc-300 hover:bg-zinc-700/60 hover:text-white'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== PHOTOS (block 1) ===== */}
              {revealedStep >= 1 && (
                <div className="space-y-3 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {isCostume ? 'Фотография костюма' : 'Фотографии'} <span className="text-red-400">*</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isCostume
                        ? 'Загрузите ровно 1 фото костюма. Больше одного фото загружать нельзя.'
                        : 'Загрузите одно или несколько фото товара'}
                    </p>
                  </div>

                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-600 group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePhoto(i)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isCostume && (
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Загружено: {photos.length} / 1</span>
                      {photos.length === 0 && <span className="text-amber-400">Нужно 1 фото</span>}
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" multiple={!isCostume} onChange={handlePhotoUpload} className="hidden" />
                  {photos.length < maxGenericPhotos && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 border-2 border-dashed border-zinc-600 hover:border-zinc-500 rounded-xl text-zinc-400 hover:text-zinc-300 text-sm transition-colors">
                      + Добавить фото
                    </button>
                  )}
                  {errors._photos && <p className="text-xs text-red-400">{errors._photos}</p>}
                  {revealedStep === 1 && (
                    <button type="button" onClick={() => advanceFrom(1)}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors mt-1">
                      Далее
                    </button>
                  )}
                </div>
              )}

              {/* ===== CATEGORY FIELD BLOCKS ===== */}
              {categorySteps.map((stepDef, i) => {
                const blockIndex = i + 2;
                if (revealedStep < blockIndex) return null;
                return (
                  <div key={i} className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                    <h3 className="text-sm font-semibold text-white">{stepDef.title}</h3>
                    {stepDef.fields.map(field => renderField(field))}
                    {revealedStep === blockIndex && (
                      <button type="button" onClick={() => advanceFrom(blockIndex)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                        Далее
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ============ CONFIRMATION PHASE ============ */}
          {genericPhase === 'confirm' && (
            <>
              {/* Summary */}
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Проверьте данные перед публикацией</h3>

                {/* Category */}
                <div className="bg-zinc-800/60 rounded-lg p-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Категория</span>
                  <p className="text-white text-sm mt-0.5">{getCategoryName()}</p>
                </div>

                {/* Photos preview */}
                {photoPreviews.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-zinc-400 font-medium">Фотографии ({photos.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All fields summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categorySteps.flatMap(step => step.fields).map(field => {
                    const val = formData[field.key];
                    if (!val) return null;
                    return (
                      <div key={field.key} className="bg-zinc-800/60 rounded-lg p-3">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{field.label}</span>
                        <p className="text-white text-sm mt-0.5">{getFieldDisplay(field)}</p>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={() => setGenericPhase('filling')}
                  className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-xl transition-colors">
                  ← Назад к редактированию
                </button>
              </div>

              {/* Listing type */}
              <div className="space-y-4 p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-xl">
                <h3 className="text-sm font-semibold text-white">Тип размещения</h3>

                <button type="button" onClick={() => setListingType('paid')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    listingType === 'paid' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">Платное размещение</span>
                    <span className="text-emerald-400 font-bold text-sm">${listingFee.toFixed(2)}</span>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    <li>• Приоритетное продвижение</li>
                    <li>• Товар выше в списке</li>
                    <li>• Повышенное доверие покупателей</li>
                    <li>• Приоритетная поддержка</li>
                  </ul>
                </button>

                <button type="button" onClick={() => setListingType('free')}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    listingType === 'free' ? 'border-zinc-500 bg-zinc-700/20' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
                  }`}>
                  <span className="text-white font-semibold text-sm">Бесплатное размещение</span>
                  <p className="text-xs text-zinc-500 mt-1">
                    Вы можете выставить товар бесплатно, но платный статус может помочь продать его быстрее и дороже.
                  </p>
                </button>

                <button type="button" onClick={handleSubmit}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all mt-1">
                  Опубликовать объявление
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default SellPage;
