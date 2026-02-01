import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { createRegisterSchema, type RegisterFormData } from '../schemas/authSchemas';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(t)),
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name || undefined,
      });
      navigate('/app', { replace: true });
    } catch {
      // Error is handled by store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t('register.name')}
        </label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          autoComplete="name"
          placeholder={t('register.namePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('register.email')}
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          autoComplete="email"
          placeholder={t('register.emailPlaceholder')}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('register.password')}
        </label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
          error={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          {t('register.confirmPassword')}
        </label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          autoComplete="new-password"
          placeholder={t('register.confirmPasswordPlaceholder')}
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        {t('register.createAccount')}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t('register.hasAccount')}
        <Link to="/auth/login" className="text-primary hover:underline">
          {t('register.signInLink')}
        </Link>
      </p>
    </form>
  );
}
