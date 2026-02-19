# AI_RULES.md — Правила для AI при работе с проектом TourneyHub

> Этот документ — обязательный контракт. AI (Cascade, Copilot, любой агент) ОБЯЗАН следовать этим правилам при генерации кода, рефакторинге и предложениях.

---

## 1. Общие принципы

### 1.1 Маленькие изменения
- **Одна задача = один коммит**. Не объединять несвязанные изменения.
- **Максимум 1-2 файла** за одно изменение, если это не спланированный рефакторинг из REFACTOR_PLAN.md.
- **Никакого хаотичного рефакторинга**. Не переименовывать переменные, не менять стиль кода, не «улучшать» файлы, которые не затронуты задачей.
- **Не трогать то, что работает**, если задача этого не требует.

### 1.2 Язык
- Комментарии в коде: на английском.
- UI тексты: на русском (текущая локаль проекта).
- Git commit messages: на английском.
- Документация: на русском, если не указано иное.

### 1.3 Стиль кода
- Следовать существующему стилю файла. Не навязывать свой.
- Не добавлять и не удалять комментарии без явного запроса.
- Не добавлять emoji в код, если пользователь не попросил.
- Imports — только в начале файла. Никогда в середине.

---

## 2. База данных и миграции

### 2.1 Любая смена схемы = миграция
- **НИКОГДА** не менять `schema.prisma` без создания миграции.
- Команда: `npx prisma migrate dev --name <описание>` (в `server/` директории).
- Имя миграции: snake_case, описательное. Пример: `add_wallet_transaction_table`, `add_game_field_to_tournament`.

### 2.2 Обратимость
- Каждая миграция должна быть обратимой (откатываемой).
- Если добавляется required поле — сначала добавить как optional с default, мигрировать данные, потом сделать required.
- **Нельзя** удалять колонки/таблицы без явного запроса. Можно пометить deprecated.
- При переименовании поля: создать новое → мигрировать данные → удалить старое (в разных миграциях).

### 2.3 Constraints
- `CHECK (uc_balance >= 0)` — обязательный для всех денежных полей.
- `UNIQUE` constraints — добавлять через миграцию, не через код.
- Индексы — добавлять для полей, используемых в WHERE/ORDER BY, если таблица будет расти.

### 2.4 Prisma Client
- **Только singleton**. Использовать `import { prisma } from '../lib/prisma'`.
- **НИКОГДА** не создавать `new PrismaClient()` в файлах роутов/сервисов.

---

## 3. Деньги, баланс, транзакции

### 3.1 Обязательные правила для любого endpoint, который трогает деньги

| Правило | Описание |
|---------|----------|
| **M-1: Транзакция** | Любая мутация баланса ОБЯЗАНА быть внутри `prisma.$transaction()` |
| **M-2: Идемпотентность** | Каждая wallet-операция ОБЯЗАНА иметь `idempotencyKey`. Формат: `{domain}-{entityId}-{operation}[-{extra}]`. Пример: `tournament-abc123-entry`, `deal-xyz-hold` |
| **M-3: Ledger** | Каждая мутация баланса ОБЯЗАНА создавать запись в `WalletTransaction` (после реализации ledger из REFACTOR_PLAN) |
| **M-4: Non-negative** | Проверка баланса ТОЛЬКО внутри транзакции. Никогда не проверять баланс вне tx, а потом списывать внутри — это race condition |
| **M-5: Serializable** | Все денежные транзакции используют `{ isolationLevel: 'Serializable' }` |
| **M-6: Retry** | Serializable tx могут фейлиться с P2034. Обязательно оборачивать в `withRetry()` |
| **M-7: Нет бизнес-логики денег на фронтенде** | Фронтенд НЕ вычисляет призы, комиссии, итоги. Только отображает то, что пришло с сервера |

### 3.2 Формат idempotencyKey

```
{domain}-{entityId}-{operation}[-{qualifier}]

Примеры:
  tournament-cuid123-entry-userCuid456     // вступление в турнир
  tournament-cuid123-prize-slot1           // приз за 1 место
  tournament-cuid123-refund-userCuid456    // возврат при отмене
  deal-cuid789-hold                        // escrow hold при покупке
  deal-cuid789-capture                     // escrow capture при подтверждении
  deal-cuid789-release                     // escrow release при отмене
  payment-extId-credit                     // пополнение с платёжного шлюза
  admin-adj-userCuid-timestamp             // ручная корректировка
```

### 3.3 До реализации Wallet Domain

Пока Wallet Domain не реализован (см. REFACTOR_PLAN шаг 1), текущий формат (`User.ucBalance increment/decrement`) допустим, НО:
- Каждый новый endpoint с деньгами должен быть внутри `$transaction(Serializable)`.
- Комментарий `// TODO: replace with wallet.debit/credit after Wallet Domain` обязателен.
- Проверка баланса — внутри tx.

---

## 4. Турниры

### 4.1 FSM строгость
- Переходы статусов Tournament и Match — ТОЛЬКО согласно FSM из ARCHITECTURE.md.
- **Никогда** не ставить статус напрямую без проверки текущего состояния.
- Паттерн:
```typescript
// Правильно:
const t = await tx.tournament.findUnique({ where: { id } });
if (t.status !== 'IN_PROGRESS') throw new Error('Invalid state');
await tx.tournament.update({ where: { id }, data: { status: 'COMPLETED' } });

// Неправильно:
await prisma.tournament.update({ where: { id }, data: { status: 'COMPLETED' } });
```

### 4.2 Resolve и Complete
- `resolveMatch()` и `completeTournament()` — ВНУТРИ `$transaction`.
- Текущий код нарушает это (resolveMatch вне tx) — будет исправлено в REFACTOR_PLAN.
- До исправления: не усугублять, не добавлять новые вызовы вне tx.

### 4.3 Socket events после tx
- Emit событий — ТОЛЬКО ПОСЛЕ успешного завершения `$transaction`.
- Никогда внутри tx (если tx откатится, событие уже уйдёт).
- Паттерн:
```typescript
const result = await prisma.$transaction(async (tx) => {
  // ... все мутации ...
  return { tournamentId, userIds };
});
// Только после успеха:
emitTournamentUpdate(result.tournamentId, { event: 'started' });
```

---

## 5. Marketplace / Escrow

### 5.1 Escrow — обязательный паттерн для всех покупок
- **Никогда** не переводить деньги продавцу сразу при покупке.
- Поток: `hold → deliver → confirm → capture+credit` или `hold → dispute → release/capture`.
- До реализации Escrow: не создавать «простые» переводы buyer→seller. Лучше заглушка, чем неправильная реализация.

### 5.2 Двойная продажа
- `Listing.status` менять на `SOLD` АТОМАРНО с созданием Deal внутри `$transaction`.
- Дополнительная защита: partial unique index `UNIQUE(listingId) WHERE status NOT IN ('CANCELLED')` на таблице Deal.

---

## 6. Breaking Changes

### 6.1 Определение breaking change
- Изменение response формата существующего API endpoint.
- Удаление/переименование поля в response.
- Изменение поведения endpoint (другая логика при тех же параметрах).
- Изменение формата request body.
- Изменение URL/метода endpoint.
- Удаление endpoint.
- Изменение схемы БД, требующее миграции данных.

### 6.2 При breaking change — обязательно

1. **Список изменений** — перечислить все затронутые endpoints/поля.
2. **Фронтенд-импакт** — перечислить файлы фронтенда, которые нужно обновить.
3. **Админка-импакт** — перечислить файлы админки, которые нужно обновить.
4. **Backward compatibility** — по возможности поддерживать старый формат параллельно.
5. **Миграция данных** — если нужна, описать в миграции.

### 6.3 Формат коммита для breaking changes

```
feat!: <описание>

BREAKING CHANGE:
- endpoint: POST /api/tournaments — добавлен required field `game`
- response: GET /api/tournaments/:id — поле `gameType` переименовано в `mode`
- affected frontend: src/pages/GamePage.tsx, src/lib/api.ts
- affected admin: admin/src/pages/TournamentsPage.tsx
- migration: 20260219_add_game_field
```

---

## 7. Файловая структура

### 7.1 Текущая (допустимая)
```
server/src/
  routes/          ← Express роуты + бизнес-логика (текущий стиль)
  middleware/
  lib/
  config/
```

### 7.2 Целевая (переход по REFACTOR_PLAN)
```
server/src/
  domains/
    auth/          ← AuthService, auth routes, auth middleware
    wallet/        ← WalletService (ledger, escrow, debit/credit)
    tournament/    ← TournamentService, strategies, routes
    marketplace/   ← MarketplaceService, ListingService, DealService
    chat/          ← ChatService, routes
    game/          ← GameConfig registry
    admin/         ← AdminService, routes
  shared/
    prisma.ts      ← singleton
    socket.ts
    supabase.ts
    errors.ts      ← AppError, typed errors
  index.ts
```

### 7.3 Правила при рефакторинге структуры
- Переносить файлы **по одному домену за раз**.
- Старые imports обновлять сразу.
- Не оставлять файлы-дубликаты.
- Тесты (когда будут) — рядом с доменом: `server/src/domains/wallet/__tests__/`.

---

## 8. Безопасность

### 8.1 Секреты
- **НИКОГДА** не хардкодить API ключи, токены, секреты.
- Все секреты — через `process.env` и `.env` файлы.
- `.env` файлы — в `.gitignore`.
- Если секрет случайно попал в код/чат — считать скомпрометированным, ротировать.

### 8.2 Валидация
- Все входящие данные — через Zod schema.
- Не доверять фронтенду для денежных расчётов.
- Не доверять фронтенду для определения статусов.
- Admin endpoints — проверять `user.role === 'ADMIN'` на каждом роуте.

### 8.3 Production
- Никаких `debug` полей в error responses на production.
- Никаких `console.log` с чувствительными данными (пароли, токены, полные объекты user).
- Rate limiting на все endpoints (текущий generalLimiter — ОК для старта).

---

## 9. Тестирование (будущее)

### 9.1 Что тестировать в первую очередь
1. **WalletService** — debit/credit/hold/capture/release, идемпотентность, non-negative, concurrent operations
2. **Tournament FSM** — все переходы состояний, edge cases (last player leaves, double submit, dispute flow)
3. **Escrow flow** — hold → capture, hold → release, double-capture prevention

### 9.2 Формат тестов
- Unit tests: `vitest` (уже в стеке проекта).
- Тестовая БД: отдельная PostgreSQL через `DATABASE_URL` в `.env.test`.
- Каждый тест — изолированный (очистка БД перед тестом или transactional rollback).

---

## 10. Чеклист перед коммитом

- [ ] Изменение затрагивает деньги? → Проверить M-1..M-7
- [ ] Изменение затрагивает schema.prisma? → Миграция создана и протестирована
- [ ] Изменение меняет API response? → Breaking change checklist (секция 6)
- [ ] Новый endpoint? → Zod validation, auth check, error handling
- [ ] Socket events? → Только после успешной tx
- [ ] Новый PrismaClient()? → **НЕТ**. Использовать singleton
- [ ] Код компилируется? → `tsc --noEmit` в server/
- [ ] Фронтенд собирается? → `npm run build` в корне
