import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { createLoginSchema, type LoginFormData } from '../schemas/authSchemas';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export function LoginForm() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(t)),
  });

  const from = location.state?.from?.pathname || '/app';

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by store
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('login.email')}
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          autoComplete="email"
          placeholder={t('login.emailPlaceholder')}
          error={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('login.password')}
        </label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          error={!!errors.password}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="w-full">
        {t('login.signIn')}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t('login.noAccount')}
        <Link to="/auth/register" className="text-primary hover:underline">
          {t('login.signUpLink')}
        </Link>
      </p>
    </form>
  );
}
