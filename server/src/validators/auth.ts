import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .max(128, 'Максимум 128 символов')
    .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .regex(/[0-9]/, 'Нужна хотя бы одна цифра'),
  username: z
    .string()
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Только латинские буквы, цифры и _'),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export const telegramAuthSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

export const sendCodeSchema = z.object({
  email: z.string().email('Некорректный email'),
  type: z.enum(['register', 'login', 'reset_password']),
});

export const verifyCodeSchema = z.object({
  email: z.string().email('Некорректный email'),
  code: z.string().length(6, 'Код должен быть 6 цифр'),
  type: z.enum(['register', 'login', 'reset_password']),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .max(128, 'Максимум 128 символов')
    .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .regex(/[0-9]/, 'Нужна хотя бы одна цифра'),
});

export const googleAuthSchema = z.object({
  code: z.string().min(1, 'Код авторизации обязателен'),
  redirect_uri: z.string().url('Некорректный redirect_uri'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>;
