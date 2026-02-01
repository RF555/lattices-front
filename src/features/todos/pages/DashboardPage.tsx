import { useTranslation } from 'react-i18next';
import { TodoTree } from '../components/TodoTree';
import { CreateTodoForm } from '../components/CreateTodoForm';
import { TodoToolbar } from '../components/TodoToolbar';

export default function DashboardPage() {
  const { t } = useTranslation('todos');
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <CreateTodoForm />
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <TodoToolbar />
        <div className="p-3 sm:p-4">
          <TodoTree />
        </div>
      </div>
    </div>
  );
}
