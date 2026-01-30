import { TodoTree } from '../components/TodoTree';
import { CreateTodoForm } from '../components/CreateTodoForm';
import { TodoToolbar } from '../components/TodoToolbar';

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Organize your work with nested tasks
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <CreateTodoForm />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TodoToolbar />
        <div className="p-4">
          <TodoTree />
        </div>
      </div>
    </div>
  );
}
