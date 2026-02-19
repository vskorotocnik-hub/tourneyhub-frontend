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

export class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён') {
    super(403, message, 'FORBIDDEN');
  }
}

export class DuplicateError extends AppError {
  constructor(message: string) {
    super(409, message, 'DUPLICATE');
  }
}

export class IdempotencyHitError extends AppError {
  constructor() {
    super(200, 'Операция уже выполнена', 'IDEMPOTENCY_HIT');
  }
}
