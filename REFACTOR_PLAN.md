# REFACTOR_PLAN.md — Пошаговый план перехода к целевой архитектуре

> Каждый шаг — безопасный, проверяемый, деплоится независимо.
> Порядок: Wallet/Ledger → Tournament Engine границы → Marketplace → Multi-game.
> Никаких больших переписываний. Инкрементальный рефакторинг.

---

## Фаза 0: Фундамент (подготовка к рефакторингу)

### Шаг 0.1 — Prisma singleton
**Проблема**: `new PrismaClient()` создаётся в `tournaments.ts`, `wow.ts`, `admin.ts` — это 3+ отдельных connection pool.
**Действие**:
1. Убедиться что `server/src/lib/prisma.ts` экспортирует singleton (уже есть).
2. Заменить `const prisma = new PrismaClient()` на `import { prisma } from '../lib/prisma'` в:
   - `server/src/routes/tournaments.ts` (строка 8)
   - `server/src/routes/wow.ts` (строка 8)
   - `server/src/routes/admin.ts` (найти и заменить)
3. Удалить `import { PrismaClient } from '@prisma/client'` из этих файлов (оставить только type imports если нужны enum).

**Проверка**: `tsc --noEmit`, сервер стартует, турниры создаются/работают.
**Файлы**: 3 файла, ~6 строк изменений.
**Риск**: 🟢 Минимальный. Поведение не меняется.

---

### Шаг 0.2 — CHECK constraint на баланс
**Проблема**: `User.ucBalance` и `User.balance` могут уйти в минус при race condition (нет DB-level protection).
**Действие**:
1. Создать миграцию: `npx prisma migrate dev --name add_balance_check_constraints`
2. SQL в миграции:
```sql
ALTER TABLE "User" ADD CONSTRAINT "user_uc_balance_non_negative" CHECK ("ucBalance" >= 0);
ALTER TABLE "User" ADD CONSTRAINT "user_balance_non_negative" CHECK ("balance" >= 0);
```
3. Prisma не поддерживает CHECK в schema — это raw SQL миграция.

**Проверка**: Попытка `UPDATE "User" SET "ucBalance" = -1` должна фейлиться. Все существующие балансы >= 0.
**Файлы**: 1 миграция.
**Риск**: 🟢 Минимальный. Если есть пользователь с отрицательным балансом — миграция упадёт. Проверить перед запуском: `SELECT id, "ucBalance" FROM "User" WHERE "ucBalance" < 0`.

---

### Шаг 0.3 — Общая структура директорий
**Действие**:
1. Создать директории:
```
server/src/domains/
server/src/domains/wallet/
server/src/domains/tournament/
server/src/domains/marketplace/
server/src/domains/chat/
server/src/domains/auth/
server/src/domains/game/
server/src/domains/admin/
server/src/shared/
```
2. Переместить `server/src/lib/prisma.ts` → `server/src/shared/prisma.ts`, обновить все imports.
3. Переместить `server/src/lib/socket.ts` → `server/src/shared/socket.ts`, обновить все imports.
4. Переместить `server/src/lib/supabase.ts` → `server/src/shared/supabase.ts`, обновить все imports.

**Проверка**: `tsc --noEmit`, сервер стартует.
**Файлы**: ~10 файлов (создание директорий + обновление imports).
**Риск**: 🟢 Минимальный. Только перемещение файлов.

---

### Шаг 0.4 — Typed errors
**Проблема**: Ошибки кидаются через `Object.assign(new Error(...), { statusCode })` — хрупкий паттерн.
**Действие**:
1. Создать `server/src/shared/errors.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(required: number, available: number) {
    super(400, `Недостаточно UC. Нужно: ${required}, доступно: ${available}`, 'INSUFFICIENT_BALANCE');
  }
}

export class InvalidStateError extends AppError {
  constructor(entity: string, currentState: string, expectedState: string) {
    super(400, `${entity} в статусе ${currentState}, ожидался ${expectedState}`, 'INVALID_STATE');
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, `${entity} не найден`, 'NOT_FOUND');
  }
}

export class DuplicateError extends AppError {
  constructor(message: string) {
    super(409, message, 'DUPLICATE');
  }
}
```
2. Добавить global error handler в `index.ts`:
```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Ошибка сервера' });
});
```
3. НЕ переделывать все существующие ошибки сразу — только создать инфраструктуру. Постепенно переходить при касании файлов.

**Проверка**: `tsc --noEmit`.
**Файлы**: 2 новых файла, 1 изменение в index.ts.
**Риск**: 🟢 Минимальный. Обратно совместимо.

---

## Фаза 1: Wallet Domain (ПРИОРИТЕТ #1)

### Шаг 1.1 — WalletTransaction таблица (ledger)
**Действие**:
1. Добавить в `schema.prisma`:
```prisma
model WalletTransaction {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation("walletTransactions", fields: [userId], references: [id])
  type            WalletTxType
  currency        WalletCurrency
  amount          Decimal       @db.Decimal(12, 2)
  balanceAfter    Decimal       @db.Decimal(12, 2)
  reason          String
  refType         String?
  refId           String?
  idempotencyKey  String        @unique
  escrowHoldId    String?
  createdAt       DateTime      @default(now())

  @@index([userId, createdAt])
  @@index([refType, refId])
}

model EscrowHold {
  id          String          @id @default(cuid())
  userId      String
  user        User            @relation("escrowHolds", fields: [userId], references: [id])
  amount      Decimal         @db.Decimal(12, 2)
  currency    WalletCurrency
  status      EscrowStatus
  reason      String
  refType     String
  refId       String
  expiresAt   DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([userId, status])
  @@index([refType, refId])
}

enum WalletTxType {
  DEBIT
  CREDIT
  HOLD
  CAPTURE
  RELEASE
}

enum WalletCurrency {
  UC
  USD
}

enum EscrowStatus {
  HELD
  CAPTURED
  RELEASED
  EXPIRED
}
```
2. Добавить relations в модель User:
```prisma
walletTransactions WalletTransaction[] @relation("walletTransactions")
escrowHolds        EscrowHold[]        @relation("escrowHolds")
```
3. Создать миграцию: `npx prisma migrate dev --name add_wallet_ledger`

**Проверка**: Миграция применяется. Таблицы существуют. Текущий функционал не сломан (таблицы пустые, никто их не читает).
**Файлы**: 1 файл (schema.prisma), 1 миграция.
**Риск**: 🟢 Минимальный. Additive change.

---

### Шаг 1.2 — WalletService
**Действие**:
1. Создать `server/src/domains/wallet/wallet.service.ts`:
```typescript
// Основные методы:
// - debit(tx, userId, amount, currency, { idempotencyKey, reason, refType, refId })
// - credit(tx, userId, amount, currency, { idempotencyKey, reason, refType, refId })
// - hold(tx, userId, amount, currency, { reason, refType, refId })
// - captureHold(tx, holdId)
// - releaseHold(tx, holdId)
// - getBalance(userId)
//
// Все методы принимают `tx` (Prisma transaction client) — вызывающий код
// управляет границами транзакции.
```
2. Ключевые детали реализации:
   - `debit`: проверка баланса + decrement + создание WalletTransaction с balanceAfter
   - `credit`: increment + создание WalletTransaction с balanceAfter
   - `hold`: decrement + создание EscrowHold(HELD) + WalletTransaction(HOLD)
   - `captureHold`: проверка status=HELD → status=CAPTURED + WalletTransaction(CAPTURE)
   - `releaseHold`: проверка status=HELD → status=RELEASED + increment + WalletTransaction(RELEASE)
   - Idempotency: try/catch на unique constraint violation → findUnique и вернуть существующую запись
3. Создать `server/src/domains/wallet/index.ts` — реэкспорт.

**Проверка**: Unit test: `debit 100 → balance decreased, WalletTransaction created. Duplicate debit with same key → no-op`.
**Файлы**: 2 новых файла.
**Риск**: 🟢 Минимальный. Никто ещё не использует — новый код.

---

### Шаг 1.3 — Интеграция WalletService в Tournament (TDM)
**Проблема**: `tournaments.ts` делает `tx.user.update({ data: { ucBalance: { decrement } } })` напрямую без ledger.
**Действие**:
1. В `tournaments.ts` — заменить все прямые `increment`/`decrement` на вызовы `walletService.debit()` / `walletService.credit()`.
2. Точки замены:
   - **Создание/join** (строки ~266-268, ~295-298): `tx.user.update({ ucBalance: decrement })` → `walletService.debit(tx, userId, bet, 'UC', { idempotencyKey: \`tournament-${tId}-entry-${userId}\`, reason: 'tournament_entry', refType: 'tournament', refId: tId })`
   - **Призы** (строки ~1264-1280): `tx.user.update({ ucBalance: increment })` → `walletService.credit(tx, player.userId, prizeAmount, 'UC', { idempotencyKey: \`tournament-${tId}-prize-${team.slot}\`, ... })`
   - **Отмена/leave** (строки ~1353-1357): `tx.user.update({ ucBalance: increment })` → `walletService.credit(tx, player.userId, bet, 'UC', { idempotencyKey: \`tournament-${tId}-refund-${player.userId}\`, reason: 'tournament_refund', ... })`
3. **НЕ менять структуру файла**. Только замена вызовов balance mutation.

**Проверка**: Создать турнир → WalletTransaction записан. Выиграть → WalletTransaction с призом записан. Отменить → WalletTransaction с refund.
**Файлы**: 1 файл (tournaments.ts), ~15 строк изменений.
**Риск**: 🟡 Средний. Критический путь (деньги). Тщательно тестировать создание, выигрыш, отмену.

---

### Шаг 1.4 — Интеграция WalletService в WoW
**Действие**: Аналогично шагу 1.3, но для `wow.ts`.
- Строки ~163, ~175 (debit при create/join)
- WoW пока не имеет completeTournament (использует тот же из tournaments) — убедиться что completeTournament уже мигрирован в 1.3.

**Проверка**: WoW турнир → WalletTransaction записан.
**Файлы**: 1 файл (wow.ts), ~8 строк изменений.
**Риск**: 🟡 Средний.

---

### Шаг 1.5 — Интеграция WalletService в Admin
**Действие**: Если админка имеет операции с балансом (ручная корректировка) — заменить на `walletService.credit/debit` с `reason: 'admin_adjustment'`.

**Проверка**: Админ корректирует баланс → WalletTransaction записан.
**Файлы**: 1 файл.
**Риск**: 🟢 Минимальный.

---

### Шаг 1.6 — resolveMatch + completeTournament внутри транзакции
**Проблема**: `resolveMatch()` (строки 1095-1212) — читает данные, пишет обновления, вызывает `completeTournament()` — всё вне `$transaction`. При concurrent submit двух капитанов возможен race.
**Действие**:
1. Переписать `submitResult` endpoint (строки 936-1091) так, чтобы **весь путь** `check → resolve → advance bracket → complete → payout` был внутри одного `prisma.$transaction(Serializable)`.
2. `resolveMatch` и `completeTournament` становятся функциями, принимающими `tx` как первый аргумент.
3. Socket events — после выхода из транзакции.

**Проверка**: Два concurrent submit result → один успешно, второй retry → корректный результат. Нет двойных выплат.
**Файлы**: 1 файл (tournaments.ts), ~100 строк переписывания.
**Риск**: 🔴 Высокий. Критический путь. Написать тест-сценарий перед изменением.

---

## Фаза 2: Tournament Engine границы

### Шаг 2.1 — Выделить TournamentService
**Действие**:
1. Создать `server/src/domains/tournament/tournament.service.ts`.
2. Перенести бизнес-логику из `tournaments.ts`:
   - `generateBracket()` → `BracketService`
   - `calculatePrizes()` → `PrizeService`
   - `calculateRatingChange()` → вспомогательная функция
   - `startTournamentInTx()` → `TournamentService.start(tx, ...)`
   - `resolveMatch()` → `TournamentService.resolveMatch(tx, ...)`
   - `completeTournament()` → `TournamentService.complete(tx, ...)`
   - `withRetry()` → `server/src/shared/retry.ts`
3. `tournaments.ts` остаётся как thin route layer: validate → call service → respond.
4. НЕ менять API контракт. Фронтенд не затрагивается.

**Проверка**: Все endpoints работают как раньше. `tsc --noEmit`.
**Файлы**: 3-4 новых файла, 1 рефакторинг существующего.
**Риск**: 🟡 Средний. Много перемещений, но логика не меняется.

---

### Шаг 2.2 — Объединить WoW в TournamentService
**Действие**:
1. Перенести логику из `wow.ts` в `TournamentService`.
2. Ввести `TournamentType` стратегии:
   - `TdmStrategy` — текущая логика TDM (matchmaking по рейтингу, bracket)
   - `WowStrategy` — текущая логика WoW (matchmaking по карте, single match)
3. `wow.ts` route file остаётся, но делегирует в `TournamentService.create({ gameType: 'WOW', ... })`.
4. Общий код (retry, debit, team creation, socket events) — в TournamentService.

**Проверка**: TDM и WoW турниры работают. WalletTransactions пишутся.
**Файлы**: 2-3 файла.
**Риск**: 🟡 Средний.

---

### Шаг 2.3 — Подготовить Classic тип
**Действие**:
1. Создать `ClassicStrategy` (stub).
2. Добавить в `GameType` enum: `CLASSIC` (миграция).
3. Endpoint пока возвращает "Скоро" (как на фронтенде).
4. Фронтенд вкладка Classic уже есть — подключить к реальному API когда будет готово.

**Проверка**: Enum расширен, миграция применена, стуб стратегии компилируется.
**Файлы**: 2-3 файла, 1 миграция.
**Риск**: 🟢 Минимальный.

---

## Фаза 3: Marketplace Domain

### Шаг 3.1 — Модели данных Marketplace
**Действие**:
1. Добавить в `schema.prisma`:
```prisma
enum ListingStatus {
  DRAFT
  ACTIVE
  SOLD
  HIDDEN
  DELETED
}

enum ListingCategory {
  ACCOUNT
  ACCOUNT_RENTAL
  UC_PACKAGE
  BOOST
  COSTUME
  CAR
  POPULARITY
  METRO
  HOME_VOTES
  CLAN
}

enum DealStatus {
  CREATED
  PAID         // escrow hold placed
  DELIVERING   // seller started transfer
  DELIVERED    // seller marked as delivered
  COMPLETED    // buyer confirmed, escrow captured
  DISPUTED     // dispute filed
  RESOLVED     // admin resolved dispute
  REFUNDED     // escrow released back to buyer
  CANCELLED    // cancelled before payment
}

model Listing {
  id            String          @id @default(cuid())
  sellerId      String
  seller        User            @relation("listings", fields: [sellerId], references: [id])
  game          Game
  category      ListingCategory
  title         String
  description   String
  price         Decimal         @db.Decimal(12, 2)
  currency      WalletCurrency  @default(UC)
  images        String[]        // URLs
  metadata      Json?           // category-specific data (collectionLevel, etc.)
  status        ListingStatus   @default(ACTIVE)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  deals         Deal[]

  @@index([game, category, status])
  @@index([sellerId])
  @@index([status, createdAt])
}

model Deal {
  id            String     @id @default(cuid())
  listingId     String
  listing       Listing    @relation(fields: [listingId], references: [id])
  buyerId       String
  buyer         User       @relation("purchases", fields: [buyerId], references: [id])
  sellerId      String
  seller        User       @relation("sales", fields: [sellerId], references: [id])
  amount        Decimal    @db.Decimal(12, 2)
  platformFee   Decimal    @db.Decimal(12, 2)
  sellerPayout  Decimal    @db.Decimal(12, 2)
  status        DealStatus @default(CREATED)
  escrowHoldId  String?    // link to EscrowHold
  
  // Delivery tracking
  deliveryNote  String?    // seller's message to buyer
  deliveredAt   DateTime?
  confirmedAt   DateTime?
  
  // Auto-complete timer
  autoCompleteAt DateTime? // if buyer doesn't confirm/dispute within 72h
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  disputes      DealDispute[]
  messages      DealMessage[]

  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
  @@index([listingId])
}

model DealMessage {
  id        String   @id @default(cuid())
  dealId    String
  deal      Deal     @relation(fields: [dealId], references: [id])
  userId    String
  user      User     @relation("dealMessages", fields: [userId], references: [id])
  content   String
  imageUrl  String?
  isSystem  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([dealId, createdAt])
}

model DealDispute {
  id          String   @id @default(cuid())
  dealId      String
  deal        Deal     @relation(fields: [dealId], references: [id])
  reporterId  String
  reason      String
  evidence    String[] // URLs to screenshots/videos
  response    String?
  responderId String?
  resolution  String?
  resolvedById String?
  status      DisputeStatus @default(OPEN)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([dealId])
  @@index([status])
}
```
2. Добавить relations в User model.
3. Миграция: `npx prisma migrate dev --name add_marketplace_tables`

**Проверка**: Миграция применяется. Таблицы пустые. Текущий функционал не затронут.
**Файлы**: 1 файл (schema.prisma), 1 миграция.
**Риск**: 🟢 Минимальный. Additive.

---

### Шаг 3.2 — ListingService + API
**Действие**:
1. Создать `server/src/domains/marketplace/listing.service.ts`:
   - `createListing(sellerId, data) → Listing`
   - `updateListing(listingId, sellerId, data) → Listing`
   - `getListings(filters) → Listing[]`
   - `getListing(id) → Listing`
   - `hideListing(listingId, sellerId) → void`
   - `deleteListing(listingId, sellerId) → void`
2. Создать `server/src/domains/marketplace/marketplace.routes.ts` — API endpoints.
3. Подключить в `index.ts`: `app.use('/api/marketplace', marketplaceRoutes)`.

**Проверка**: POST /api/marketplace/listings → листинг создан. GET — список возвращается.
**Файлы**: 2-3 новых файла, 1 изменение в index.ts.
**Риск**: 🟢 Минимальный. Новый функционал.

---

### Шаг 3.3 — DealService + Escrow flow
**Действие**:
1. Создать `server/src/domains/marketplace/deal.service.ts`:
   - `purchaseListing(buyerId, listingId) → Deal` — hold escrow, create Deal(PAID)
   - `startDelivery(dealId, sellerId, note?) → Deal` — PAID → DELIVERING
   - `markDelivered(dealId, sellerId) → Deal` — DELIVERING → DELIVERED
   - `confirmDelivery(dealId, buyerId) → Deal` — DELIVERED → COMPLETED (capture + credit seller)
   - `disputeDeal(dealId, userId, reason) → DealDispute`
   - `cancelDeal(dealId, userId) → Deal` — release escrow
   - `autoCompleteDeal(dealId) → Deal` — called by timer/cron
2. Каждая операция — через `$transaction(Serializable)`.
3. Все денежные операции через `WalletService`.

**Проверка**: Полный flow: create listing → purchase → deliver → confirm → seller получает деньги. Все WalletTransactions записаны.
**Файлы**: 1-2 новых файла.
**Риск**: 🟡 Средний. Escrow — критический путь.

---

### Шаг 3.4 — Подключить фронтенд Accounts к реальному API
**Действие**:
1. Заменить mock data в `AccountsPage.tsx` на вызовы `/api/marketplace/listings?game=PUBG_MOBILE&category=ACCOUNT`.
2. Заменить mock data в `AccountDetailPage.tsx` на вызов `/api/marketplace/listings/:id`.
3. Добавить API вызовы в `src/lib/api.ts`.
4. `SellPage.tsx` — подключить к `POST /api/marketplace/listings`.

**Проверка**: Список аккаунтов загружается с сервера. Продажа создаёт листинг. Покупка создаёт Deal.
**Файлы**: 3-4 файла фронтенда, 1 файл api.ts.
**Риск**: 🟡 Средний. UI переключается с mock на real data.

---

### Шаг 3.5 — Остальные категории Marketplace
**Действие**: Поочерёдно подключить оставшиеся:
1. AccountRental (аренда — отдельный flow с таймером)
2. Currency (UC пакеты — зависит от платёжного шлюза, пока stub)
3. Boost (услуги — escrow flow)
4. Items (костюмы, машины, популярность, метро, голоса, кланы — стандартный escrow flow)

Каждая категория — отдельный коммит. Все используют один DealService.

**Риск**: 🟡 Средний.

---

## Фаза 4: Multi-Game Layer

### Шаг 4.1 — Game enum + поле на Tournament и Listing
**Действие**:
1. Добавить `Game` enum в schema.prisma (если ещё не добавлен в фазе 3):
```prisma
enum Game {
  PUBG_MOBILE
}
```
2. Добавить `game Game @default(PUBG_MOBILE)` в модель `Tournament`.
3. Миграция: `npx prisma migrate dev --name add_game_field`
4. Все существующие турниры получат `PUBG_MOBILE` через default.

**Проверка**: Миграция применяется. Существующие турниры имеют `game = PUBG_MOBILE`.
**Файлы**: 1 файл, 1 миграция.
**Риск**: 🟢 Минимальный.

---

### Шаг 4.2 — GameConfig registry
**Действие**:
1. Создать `server/src/domains/game/game-config.ts` — registry с конфигами.
2. Создать `server/src/domains/game/configs/pubg-mobile.ts` — конфиг PUBG Mobile.
3. Валидация в tournament endpoints: `playerIdFormat`, `betRange`, `regions` — из GameConfig.
4. Фронтенд пока не трогать (`:gameId` в URL уже есть).

**Проверка**: Создание турнира с невалидным playerId для PUBG → ошибка. Конфиг загружается.
**Файлы**: 2-3 новых файла, изменения в tournament routes для валидации.
**Риск**: 🟢 Минимальный.

---

### Шаг 4.3 — Добавление второй игры (когда будет нужно)
**Действие**:
1. Добавить значение в `Game` enum (миграция).
2. Создать конфиг в `server/src/domains/game/configs/`.
3. TournamentService уже поддерживает разные стратегии — добавить strategy для новой игры.
4. Фронтенд: `/game/standoff-2/` → загружает конфиг игры → показывает соответствующие режимы.

**Риск**: 🟢 Минимальный при правильной архитектуре фазы 2.

---

## Фаза 5: Инфраструктура (при росте нагрузки)

### Шаг 5.1 — Redis adapter для Socket.IO
**Когда**: >10K concurrent connections ИЛИ >1 инстанс сервера.
**Действие**:
1. `npm install @socket.io/redis-adapter redis`
2. Подключить в `shared/socket.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
const pubClient = createClient({ url: env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

### Шаг 5.2 — BullMQ для фоновых задач
**Когда**: нужны auto-complete deals, cleanup expired escrow, scheduled tournaments.
**Действие**:
1. `npm install bullmq`
2. Создать `server/src/shared/queue.ts`
3. Jobs: `autoCompleteDeal`, `expireEscrowHold`, `cleanupSessions`

### Шаг 5.3 — Redis cache
**Когда**: hot endpoints (leaderboards, tournament lists) тормозят БД.
**Действие**: Cache-aside pattern. `getFromCache → if miss → getFromDB → setCache`.

### Шаг 5.4 — Read replicas
**Когда**: >100K пользователей, DB CPU >70%.
**Действие**: Prisma `$extends` с read replica URL для read-only запросов.

---

## Порядок выполнения — сводка

| # | Шаг | Приоритет | Зависимости | Риск |
|---|-----|-----------|-------------|------|
| 0.1 | Prisma singleton | Фундамент | — | 🟢 |
| 0.2 | CHECK constraints | Фундамент | — | 🟢 |
| 0.3 | Структура директорий | Фундамент | — | 🟢 |
| 0.4 | Typed errors | Фундамент | 0.3 | 🟢 |
| **1.1** | **WalletTransaction таблица** | **Критический** | 0.1 | 🟢 |
| **1.2** | **WalletService** | **Критический** | 1.1, 0.3 | 🟢 |
| **1.3** | **Wallet → Tournament TDM** | **Критический** | 1.2 | 🟡 |
| **1.4** | **Wallet → WoW** | **Критический** | 1.2 | 🟡 |
| 1.5 | Wallet → Admin | Важный | 1.2 | 🟢 |
| **1.6** | **resolveMatch в tx** | **Критический** | 1.3 | 🔴 |
| 2.1 | TournamentService | Важный | 1.3, 1.4 | 🟡 |
| 2.2 | Объединить WoW | Важный | 2.1 | 🟡 |
| 2.3 | Classic stub | Низкий | 2.1 | 🟢 |
| 3.1 | Marketplace модели | Важный | 1.1 | 🟢 |
| 3.2 | ListingService | Важный | 3.1 | 🟢 |
| **3.3** | **DealService + Escrow** | **Критический** | 3.1, 1.2 | 🟡 |
| 3.4 | Фронтенд Accounts | Важный | 3.2, 3.3 | 🟡 |
| 3.5 | Остальные категории | Средний | 3.3 | 🟡 |
| 4.1 | Game enum | Средний | — | 🟢 |
| 4.2 | GameConfig | Средний | 4.1 | 🟢 |
| 5.x | Инфра (Redis, BullMQ) | По необходимости | — | 🟡 |

---

## Правила выполнения

1. **Один шаг за раз**. Не начинать следующий, пока текущий не задеплоен и проверен.
2. **Каждый шаг — один PR/коммит** (или серия мелких коммитов в рамках одного шага).
3. **Не ломать production**. После каждого шага — деплой и smoke test.
4. **При сомнениях — спросить**. Лучше уточнить, чем переделывать.
5. **Фронтенд не трогать** до фазы 3.4. Backend-first.
