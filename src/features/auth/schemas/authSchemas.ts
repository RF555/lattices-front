import { z } from 'zod';
import type { TFunction } from 'i18next';

export function createLoginSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}

export function createRegisterSchema(t: TFunction<'auth'>) {
  return z
    .object({
      name: z.string().optional(),
      email: z.string().email(t('validation.emailInvalid')),
      password: z.string().min(8, t('validation.passwordMinLength')),
      confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    });
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
