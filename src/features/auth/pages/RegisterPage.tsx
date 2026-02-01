import { useTranslation } from 'react-i18next';
import { RegisterForm } from '../components/RegisterForm';
import { LanguageSwitcher } from '@components/ui/LanguageSwitcher';

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('brand.name')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('brand.taglineRegister')}
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
