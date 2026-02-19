# ARCHITECTURE.md — TourneyHub Target Architecture

> Модульный монолит. Один деплой, чёткие границы доменов, контракты между модулями.
> Текущая игра: PUBG Mobile. Архитектура готова к добавлению других игр.

---

## 1. Домены и ответственность

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (Express)                     │
│   routes → validate (zod) → delegate to domain service           │
├────────┬────────┬───────────┬────────────┬──────────┬───────────┤
│ Auth   │ Wallet │Tournament │Marketplace │ Chat     │ Admin     │
│ Domain │ Domain │  Domain   │  Domain    │ Domain   │ Domain    │
├────────┴────────┴───────────┴────────────┴──────────┴───────────┤
│                     Shared Infrastructure                        │
│   Prisma · Socket.IO · Supabase Storage · Redis (future)        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 Auth Domain
- **Ответственность**: регистрация, логин, OAuth (Telegram, Google), email-верификация, JWT refresh, бан
- **Модели**: `User`, `TelegramAuth`, `GoogleAuth`, `RefreshToken`, `EmailVerification`, `TelegramAuthSession`
- **Файлы (текущие)**: `server/src/routes/auth.ts`, `server/src/middleware/auth.ts`
- **Целевое расположение**: `server/src/domains/auth/`
- **Экспортируемый интерфейс**:
  - `getUserById(id) → User`
  - `verifyToken(token) → { userId }`
  - `requireAuth middleware`

### 1.2 Wallet Domain (NEW — ключевой)
- **Ответственность**: все операции с деньгами — `balance` (USD), `ucBalance` (UC). Ledger транзакций. Идемпотентность. Escrow holds.
- **Модели (целевые)**: `WalletTransaction` (ledger), `EscrowHold`
- **Текущее состояние**: баланс хранится в `User.balance` и `User.ucBalance`, мутируется через `increment`/`decrement` без журнала
- **Целевое расположение**: `server/src/domains/wallet/`
- **Экспортируемый интерфейс**:
  - `debit(userId, amount, currency, { idempotencyKey, reason, refId }) → WalletTransaction`
  - `credit(userId, amount, currency, { idempotencyKey, reason, refId }) → WalletTransaction`
  - `hold(userId, amount, currency, { reason, refId }) → EscrowHold` — резервирование средств
  - `captureHold(holdId) → WalletTransaction` — списание зарезервированных средств
  - `releaseHold(holdId) → void` — возврат зарезервированных средств
  - `getBalance(userId) → { balance, ucBalance }`
  - Все операции ДОЛЖНЫ быть внутри Prisma `$transaction`

### 1.3 Tournament Domain
- **Ответственность**: создание турниров, матчмейкинг, bracket generation, результаты, споры, завершение, выплаты
- **Подтипы** (единый движок, разные правила):
  - **TDM** — 1v1/2v2, bracket-система (2/3/4 команды), рейтинговый матчмейкинг
  - **WoW** — до 8 команд, до 4 игроков/команда, кастомные карты с параметрами
  - **Classic** (будущее) — большие турниры, другие правила
- **Модели**: `Tournament`, `TournamentTeam`, `TournamentPlayer`, `TournamentMatch`, `Dispute`
- **Файлы (текущие)**: `server/src/routes/tournaments.ts` (1712 строк), `server/src/routes/wow.ts` (273 строки)
- **Целевое расположение**: `server/src/domains/tournament/`
- **Экспортируемый интерфейс**:
  - `createTournament(params) → Tournament`
  - `joinTournament(tournamentId, playerData) → JoinResult`
  - `submitResult(tournamentId, matchId, userId, winnerId) → ResultOutcome`
  - `leaveTournament(tournamentId, userId) → void`
  - `fileDispute(tournamentId, userId, data) → Dispute`
  - `resolveMatch(tournamentId, matchId, winnerId) → void` (вызывается из submit + admin)
- **Интеграция с Wallet**: турнир НЕ трогает `User.ucBalance` напрямую. Вызывает `wallet.debit()` / `wallet.credit()` / `wallet.hold()`

### 1.4 Marketplace Domain (NEW)
- **Ответственность**: листинги, покупки, аренда, escrow-сделки
- **Подтипы**:
  - **Accounts** — покупка/продажа аккаунтов
  - **AccountRental** — почасовая аренда
  - **Currency** — продажа UC пакетов
  - **Boost** — услуги буста
  - **Items** — костюмы, машины, популярность, метро, голоса дома, кланы
- **Модели (целевые)**: `Listing`, `Deal` (покупка/аренда), `DealMessage`, `SellerProfile`
- **Целевое расположение**: `server/src/domains/marketplace/`
- **Экспортируемый интерфейс**:
  - `createListing(sellerId, data) → Listing`
  - `purchaseListing(buyerId, listingId) → Deal` (через escrow)
  - `confirmDelivery(dealId, buyerId) → void` (release escrow to seller)
  - `disputeDeal(dealId, userId, reason) → DealDispute`
  - `cancelListing(listingId, sellerId) → void`
- **Escrow-поток** (подробнее в секции 4)

### 1.5 Chat Domain
- **Ответственность**: сообщения в турнирах, поддержка, будущие deal-чаты
- **Модели**: `TournamentMessage`, `SupportMessage`, будущие `DealMessage`
- **Целевое расположение**: `server/src/domains/chat/`
- **Примечание**: чат привязан к контексту (tournament, deal, support). Контекст определяет правила доступа.

### 1.6 Admin Domain
- **Ответственность**: управление пользователями, турнирами, WoW картами, споры, поддержка, статистика
- **Целевое расположение**: `server/src/domains/admin/`
- **Примечание**: админ НЕ мутирует баланс напрямую. Вызывает `wallet.credit()` / `wallet.debit()` с reason = `admin_adjustment`.

### 1.7 Multi-Game Layer
- **Ответственность**: маршрутизация по `gameId`, конфиги и правила для каждой игры
- **Целевое расположение**: `server/src/domains/game/`
- **Подробнее в секции 6**

---

## 2. Инварианты

### 2.1 Деньги и баланс

| Инвариант | Описание | Механизм защиты |
|-----------|----------|-----------------|
| **I-1** | Баланс пользователя НИКОГДА не уходит в минус | `CHECK (uc_balance >= 0)` на уровне БД + проверка перед списанием в транзакции |
| **I-2** | Каждая мутация баланса записывается в ledger | `WalletTransaction` создаётся атомарно вместе с `UPDATE User` в одной Prisma `$transaction` |
| **I-3** | Сумма всех `credit` минус `debit` по ledger = текущий баланс | Reconciliation job (периодическая проверка) |
| **I-4** | Операция с idempotencyKey выполняется ровно 1 раз | `UNIQUE(idempotencyKey)` на `WalletTransaction`. При дупликате — возврат существующей записи |
| **I-5** | Escrow hold блокирует средства, но не списывает | `hold` → `User.ucBalance -= amount`, создаёт `EscrowHold(status=HELD)`. `capture` → ledger запись. `release` → `User.ucBalance += amount` |
| **I-6** | Platform fee начисляется только при завершении турнира/сделки | Не при создании, а при `completeTournament` / `completeDeal` |

### 2.2 Турниры

| Инвариант | Описание | Механизм защиты |
|-----------|----------|-----------------|
| **I-7** | Игрок не может быть в двух активных турнирах одного типа одновременно | Проверка в `$transaction` при создании/вступлении |
| **I-8** | Турнир стартует ТОЛЬКО когда все слоты заполнены | `if (nextSlot >= teamCount)` внутри serializable tx |
| **I-9** | Результат матча определяется ТОЛЬКО при согласии обеих сторон ИЛИ решении админа | `teamAResult === teamBResult` → auto-resolve. Иначе → DISPUTED |
| **I-10** | Призы распределяются ровно 1 раз | `status: COMPLETED` ставится атомарно с выплатой в одной `$transaction`. Повторный вызов проверяет статус |
| **I-11** | При отмене турнира все ставки возвращаются | `wallet.credit()` для каждого участника с `reason: tournament_refund` |

### 2.3 Marketplace / Escrow

| Инвариант | Описание | Механизм защиты |
|-----------|----------|-----------------|
| **I-12** | Листинг продаётся ровно 1 раз | `Listing.status` = `SOLD` ставится атомарно с созданием `Deal` в `$transaction`. `UNIQUE` constraint на `Deal(listingId)` для non-cancelled deals |
| **I-13** | Деньги покупателя блокируются при покупке, НЕ переводятся продавцу сразу | `wallet.hold()` при создании Deal. `wallet.captureHold()` + `wallet.credit(seller)` при confirmDelivery |
| **I-14** | При отмене сделки деньги возвращаются покупателю | `wallet.releaseHold()` |
| **I-15** | Продавец не может снять листинг после начала сделки | `Listing.status` проверяется в `$transaction` |

---

## 3. FSM (Finite State Machines)

### 3.1 Tournament FSM

```
              ┌─── leave (last) ───┐
              │                    ▼
SEARCHING ────┼─── full ──► IN_PROGRESS ──► COMPLETED
              │                │     ▲          ▲
              ▼                ▼     │          │
          CANCELLED        DISPUTED ─┘     admin resolve
                           (results disagree     │
                            or manual dispute)    │
                               │                  │
                               └──────────────────┘
```

**Переходы:**
- `SEARCHING → IN_PROGRESS`: все команды набраны (`nextSlot >= teamCount`)
- `SEARCHING → CANCELLED`: последний участник вышел
- `IN_PROGRESS → COMPLETED`: финальный матч resolved, призы распределены
- `IN_PROGRESS → DISPUTED`: результаты не совпадают ИЛИ подана жалоба
- `DISPUTED → IN_PROGRESS`: жалоба отменена, результаты исправлены
- `DISPUTED → COMPLETED`: админ принял решение, принудительный resolve

### 3.2 Match FSM

```
PENDING ──► ACTIVE ──► COMPLETED
                │           ▲
                ▼           │
            DISPUTED ───────┘
              (admin force-resolve
               or results now agree)
```

**Переходы:**
- `PENDING → ACTIVE`: bracket advancement (предыдущий раунд завершён) или турнир стартовал
- `ACTIVE → COMPLETED`: оба капитана согласны с победителем
- `ACTIVE → DISPUTED`: результаты не совпадают
- `DISPUTED → COMPLETED`: админ принудительно выбрал победителя ИЛИ результаты стали совпадать

### 3.3 Deal (Purchase) FSM — целевая

```
                    ┌── timeout ──┐
                    │             ▼
CREATED ──► PAID ──► DELIVERING ──► DELIVERED ──► COMPLETED
  │           │         │              │
  ▼           ▼         ▼              ▼
CANCELLED  REFUNDED  DISPUTED ──► RESOLVED
                                    │    │
                                    ▼    ▼
                               COMPLETED  REFUNDED
```

**Переходы:**
- `CREATED → PAID`: `wallet.hold()` успешно (средства зарезервированы)
- `PAID → DELIVERING`: продавец подтвердил, начал передачу
- `DELIVERING → DELIVERED`: продавец отметил доставку
- `DELIVERED → COMPLETED`: покупатель подтвердил получение → `wallet.captureHold()` + `wallet.credit(seller)`
- `DELIVERING → DISPUTED`: покупатель или продавец подал жалобу
- `DISPUTED → RESOLVED → COMPLETED`: админ решил в пользу продавца
- `DISPUTED → RESOLVED → REFUNDED`: админ решил в пользу покупателя → `wallet.releaseHold()`
- `DELIVERING → COMPLETED` (auto): таймаут (72 часа) без жалобы → auto-complete
- `CREATED → CANCELLED`: покупатель отменил до оплаты
- `PAID → REFUNDED`: продавец не начал доставку в срок → auto-refund

### 3.4 Payment FSM — целевая (пополнение баланса)

```
INITIATED ──► PENDING_PROVIDER ──► CONFIRMED ──► CREDITED
    │                │
    ▼                ▼
CANCELLED        FAILED
```

**Переходы:**
- `INITIATED → PENDING_PROVIDER`: запрос отправлен в платёжный шлюз
- `PENDING_PROVIDER → CONFIRMED`: webhook от провайдера (success)
- `PENDING_PROVIDER → FAILED`: webhook от провайдера (failed) или timeout
- `CONFIRMED → CREDITED`: `wallet.credit()` с idempotencyKey = paymentId
- `INITIATED → CANCELLED`: пользователь отменил

---

## 4. Потоки (Data Flows)

### 4.1 Purchase UC → Credit Wallet

```
Client                  API                 PaymentProvider        Wallet
  │                      │                        │                  │
  ├─ POST /payments ────►│                        │                  │
  │                      ├─ create Payment ───────┤                  │
  │                      │  (status=INITIATED)    │                  │
  │                      ├─ redirect/form ───────►│                  │
  │                      │                        │                  │
  │                      │◄── webhook (success) ──┤                  │
  │                      │                        │                  │
  │                      ├─ verify signature ─────┤                  │
  │                      ├─ Payment.status = CONFIRMED               │
  │                      ├─────────────────────────────────────────►│
  │                      │   wallet.credit(userId, amount, 'UC',    │
  │                      │     { idempotencyKey: paymentId })       │
  │                      │                                          │
  │                      │◄─────────────── WalletTransaction ──────┤
  │                      ├─ Payment.status = CREDITED               │
  │◄── balance:update ──┤  (emit via Socket.IO)                    │
```

### 4.2 Join Tournament → Debit → Match → Payout

```
Player              TournamentDomain            WalletDomain          Socket
  │                       │                         │                   │
  ├─ POST /tournaments ──►│                         │                   │
  │                       ├─ $transaction {         │                   │
  │                       │    wallet.debit(uid,    │                   │
  │                       │      bet, 'UC',         │                   │
  │                       │      { key: `t-${tId}-${uid}`,             │
  │                       │        reason: 'tournament_entry' })       │
  │                       │    create Team+Player   │                   │
  │                       │    if (full) startTournament()             │
  │                       │  }                      │                   │
  │                       ├──── emit ───────────────┼─────────────────►│
  │                       │  balance:update          │    tournament:started
  │                       │                         │                   │
  ═══════════ match played in-game ════════════════════════════════════
  │                       │                         │                   │
  ├─ POST result ────────►│                         │                   │
  │                       ├─ if both agree:         │                   │
  │                       │    resolveMatch()       │                   │
  │                       │    if (final):          │                   │
  │                       │      completeTournament()                   │
  │                       │      $transaction {     │                   │
  │                       │        wallet.credit(winner, prize, 'UC',  │
  │                       │          { key: `t-${tId}-prize-${slot}`,  │
  │                       │            reason: 'tournament_prize' })   │
  │                       │        Tournament.status = COMPLETED       │
  │                       │      }                  │                   │
  │                       ├──── emit ───────────────┼─────────────────►│
  │                       │  balance:update (all)    │   tournament:update
```

### 4.3 Marketplace Buy → Escrow → Complete

```
Buyer               MarketplaceDomain         WalletDomain         Seller
  │                       │                       │                   │
  ├─ POST /buy ──────────►│                       │                   │
  │                       ├─ $transaction {       │                   │
  │                       │    check Listing.status == ACTIVE         │
  │                       │    Listing.status = SOLD                  │
  │                       │    wallet.hold(buyer, price, 'UC',       │
  │                       │      { key: `deal-${dealId}` })          │
  │                       │    create Deal(status=PAID)               │
  │                       │  }                    │                   │
  │                       ├── notify ─────────────┼──────────────────►│
  │                       │                       │    "Вы продали!"  │
  │                       │                       │                   │
  │                       │◄──────── confirm delivery ────────────────┤
  │                       ├─ Deal.status = DELIVERING                 │
  │                       │                       │                   │
  ═══════════ transfer happens (in-game / credentials) ═══════════════
  │                       │                       │                   │
  ├─ POST /confirm ──────►│                       │                   │
  │                       ├─ $transaction {       │                   │
  │                       │    wallet.captureHold(holdId)             │
  │                       │    wallet.credit(seller, amount - fee,    │
  │                       │      'UC', { reason: 'sale_payout' })    │
  │                       │    Deal.status = COMPLETED                │
  │                       │  }                    │                   │
  │                       ├── notify both ────────┤                   │
```

---

## 5. Race Conditions и защита

### 5.1 Текущие проблемы (зафиксированы в коде)

| Проблема | Где | Уровень риска |
|----------|-----|---------------|
| **Двойное списание при вступлении** | `tournaments.ts:266`, `wow.ts:163` | 🟢 Защищено (Serializable tx + retry) |
| **resolveMatch вне транзакции** | `tournaments.ts:1095-1212` | 🔴 НЕ защищено — `resolveMatch()` читает и пишет вне `$transaction`, race при concurrent result submit |
| **completeTournament вне транзакции** | `tournaments.ts:1216-1318` | 🔴 НЕ защищено — выплаты внутри tx, но вызов из resolveMatch уже вне tx |
| **Двойной join (один user, два запроса)** | `tournaments.ts:724` | 🟢 Защищено (`alreadyIn` check внутри Serializable tx) |
| **Баланс без ledger** | Все файлы | 🔴 Нет аудита, невозможно отследить откуда/куда ушли деньги |
| **Нет idempotency key** | Все wallet-операции | 🔴 Retry на клиенте может привести к двойному списанию/начислению |
| **new PrismaClient() в каждом route-файле** | `tournaments.ts:8`, `wow.ts:8` | 🟡 Утечка connections. Должен быть singleton |

### 5.2 Целевая защита

| Точка риска | Механизм |
|-------------|----------|
| **Двойное списание** | Serializable transaction + idempotencyKey в WalletTransaction |
| **Двойная покупка листинга** | `UNIQUE(listingId)` на Deal (где status != CANCELLED) + Serializable tx |
| **Двойное завершение турнира** | Проверка `status !== COMPLETED` внутри $transaction перед выплатой |
| **Concurrent result submit** | resolveMatch + completeTournament ВНУТРИ одной Serializable $transaction |
| **Двойной webhook от провайдера** | idempotencyKey = paymentId на wallet.credit |
| **Escrow double-capture** | EscrowHold.status = HELD → CAPTURED атомарно, проверка в tx |
| **Stale balance read** | Все reads баланса ТОЛЬКО внутри $transaction при списании |

### 5.3 Уровни изоляции

| Операция | Уровень | Почему |
|----------|---------|--------|
| Создание/вступление в турнир | `Serializable` | Матчмейкинг + debit в одной tx |
| Отправка результата → resolve → complete | `Serializable` | Prevent double-resolve |
| Marketplace buy (hold) | `Serializable` | Prevent двойная покупка |
| Escrow capture/release | `Serializable` | Prevent double-capture |
| Чтение списка турниров | `ReadCommitted` (default) | Не критично |
| Чтение профиля/баланса | `ReadCommitted` (default) | Не критично |

---

## 6. Multi-Game Layer

### 6.1 Где хранится gameId

**Текущее состояние:**
- `Tournament.gameType` — enum `{ TDM, WOW }`. Это не gameId, а тип турнира.
- Нет явного поля `gameId` (PUBG/Standoff/etc.) — подразумевается PUBG Mobile.
- Фронтенд: `/game/:gameId/...` — `gameId` в URL, но бэкенд его не принимает.

**Целевое состояние:**

```prisma
enum Game {
  PUBG_MOBILE
  STANDOFF_2
  // ...future games
}

model Tournament {
  game      Game     // какая игра
  gameType  GameType // какой режим внутри игры (TDM, WOW, Classic...)
  // ...
}

model Listing {
  game      Game
  category  ListingCategory
  // ...
}
```

### 6.2 Как gameId проходит через систему

```
Frontend                    API                         Domain
  │                          │                            │
  ├─ /game/pubg-mobile ─────►│                            │
  │   body: { game: 'PUBG_MOBILE', ... }                  │
  │                          ├─ validate game enum ───────►│
  │                          │   route to game-specific    │
  │                          │   rules/config              │
  │                          │                            │
  │                          │   GameConfig.get('PUBG_MOBILE')
  │                          │   → { playerIdFormat: /^\d{10}$/,
  │                          │      modes: ['TDM','WOW','CLASSIC'],
  │                          │      betRange: [60, 3000],
  │                          │      regions: ['EUROPE','NA',...] }
  │                          │                            │
  │                          │   Tournament.create({      │
  │                          │     game: 'PUBG_MOBILE',   │
  │                          │     gameType: 'TDM',       │
  │                          │     ... })                 │
```

### 6.3 Game Config Registry

```typescript
// server/src/domains/game/configs/pubg-mobile.ts
export const pubgMobileConfig: GameConfig = {
  id: 'PUBG_MOBILE',
  name: 'PUBG Mobile',
  playerIdFormat: /^\d{10}$/,
  playerIdLabel: 'PUBG ID (10 цифр)',
  modes: {
    TDM: {
      teamModes: ['SOLO', 'DUO'],
      maxTeams: 4,
      betRange: [60, 3000],
    },
    WOW: {
      teamModes: ['SOLO', 'DUO', 'TRIO', 'SQUAD'],
      maxTeams: 8,
      betRange: [60, 3000],
      usesCustomMaps: true,
    },
  },
  regions: ['EUROPE', 'NA', 'ASIA', 'ME', 'SA'],
  marketplaceCategories: ['account', 'uc', 'costume', 'car', 'popularity', 'metro', 'home-votes', 'clan', 'rental', 'boost'],
};
```

Добавление новой игры = новый конфиг-файл + enum value в Prisma. Без изменения движка турниров.

---

## 7. Wallet / Ledger — детальная схема

### 7.1 Целевая модель данных

```prisma
model WalletTransaction {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  type            WalletTxType    // DEBIT, CREDIT, HOLD, CAPTURE, RELEASE
  currency        Currency        // UC, USD
  amount          Decimal         @db.Decimal(12, 2)
  
  // Результирующий баланс ПОСЛЕ операции (для аудита)
  balanceAfter    Decimal         @db.Decimal(12, 2)
  
  reason          String          // tournament_entry, tournament_prize, tournament_refund,
                                  // marketplace_hold, marketplace_capture, marketplace_release,
                                  // admin_adjustment, deposit, withdrawal
  
  // Ссылка на источник операции
  refType         String?         // tournament, deal, payment, admin
  refId           String?         // ID турнира, сделки, платежа
  
  // Идемпотентность
  idempotencyKey  String          @unique
  
  // Escrow link
  escrowHoldId    String?
  
  createdAt       DateTime        @default(now())
  
  @@index([userId, createdAt])
  @@index([refType, refId])
  @@index([idempotencyKey])
}

model EscrowHold {
  id          String       @id @default(cuid())
  userId      String
  amount      Decimal      @db.Decimal(12, 2)
  currency    Currency
  status      EscrowStatus // HELD, CAPTURED, RELEASED, EXPIRED
  reason      String
  refType     String       // deal, tournament
  refId       String
  expiresAt   DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
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

enum Currency {
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

### 7.2 Гарантии

1. **Атомарность**: `UPDATE User SET uc_balance = uc_balance - amount` + `INSERT WalletTransaction` в одной `$transaction(Serializable)`
2. **Non-negative**: `CHECK (uc_balance >= 0)` constraint в PostgreSQL. Если decrement уведёт в минус → constraint violation → tx rollback
3. **Idempotency**: `UNIQUE(idempotencyKey)`. При дубликате — `findUnique` возвращает существующую запись вместо создания новой
4. **Audit trail**: `balanceAfter` записывается в момент операции. При расхождении — алерт

---

## 8. Tournament Engine — единый движок

### 8.1 Архитектура

```
TournamentService (единая точка входа)
  │
  ├─ MatchmakingStrategy (интерфейс)
  │    ├─ TdmMatchmaking (рейтинговые окна)
  │    └─ WowMatchmaking (по карте + ставке + серверу)
  │
  ├─ BracketStrategy (интерфейс)
  │    ├─ EliminationBracket (2/3/4 команды — текущий TDM)
  │    └─ SingleMatchBracket (WoW — одна игра на карте)
  │
  ├─ RulesEngine (интерфейс)
  │    ├─ TdmRules { teamModes, maxTeams: 4, betRange, ratingCalc }
  │    ├─ WowRules { usesMap: true, maxTeams: 8, playersPerTeam: 1-4 }
  │    └─ ClassicRules { ... future }
  │
  └─ PrizeDistribution
       ├─ DefaultDistribution (процентное деление)
       └─ MapDistribution (WoW — из WoWMap.prizeDistribution)
```

### 8.2 Зачем единый движок

Текущие проблемы:
- `tournaments.ts` (1712 строк) и `wow.ts` (273 строк) дублируют: retry logic, balance debit, team/player creation, system messages, socket events
- Разные стили: `tournaments.ts` — развёрнутый, `wow.ts` — сжатый с однобуквенными переменными
- Добавление Classic потребует третьего файла с той же дупликацией

Целевое: один `TournamentService.create()` → выбирает нужную стратегию по `gameType`.

---

## 9. Зависимости между доменами

```
Auth ◄────── все домены (middleware)
  │
Wallet ◄──── Tournament (debit/credit/hold)
  │     ◄──── Marketplace (hold/capture/release)
  │     ◄──── Admin (adjustment)
  │     ◄──── Payment (credit from external)
  │
Game ◄────── Tournament (validation rules)
  │   ◄────── Marketplace (categories)
  │
Chat ◄────── Tournament (tournament messages)
  │   ◄────── Marketplace (deal messages, future)
  │   ◄────── Support (support messages)
```

**Правило**: зависимости ТОЛЬКО сверху вниз. Wallet НЕ знает про Tournament. Tournament вызывает Wallet, но Wallet — generic сервис.

---

## 10. Инфраструктура (текущая → целевая)

| Компонент | Текущее | Целевое (фаза 1) | Целевое (фаза 2, при нагрузке) |
|-----------|---------|-------------------|-------------------------------|
| **Runtime** | Node.js + Express | Без изменений | Без изменений |
| **DB** | PostgreSQL (Railway) | + CHECK constraints, + ledger tables | Read replicas |
| **ORM** | Prisma (multiple instances!) | Prisma singleton | Без изменений |
| **Real-time** | Socket.IO (single instance) | Без изменений | + Redis adapter |
| **Storage** | Supabase Storage | Без изменений | CDN перед Supabase |
| **Cache** | Нет | Нет (не нужен на старте) | Redis (сессии, rate limit, leaderboards) |
| **Queues** | Нет | Нет (не нужен на старте) | BullMQ (auto-complete deals, cleanup) |
| **Payments** | Нет | Интеграция с 1 провайдером | Несколько провайдеров |
| **Deploy** | Railway (server) + Vercel (frontend) | Без изменений | Horizontal scaling |
