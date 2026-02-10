import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/LoginForm';
import { LanguageSwitcher } from '@components/ui/LanguageSwitcher';
import { LatticesLogo } from '@components/brand';

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LatticesLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">{t('brand.name')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('brand.tagline')}</p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
