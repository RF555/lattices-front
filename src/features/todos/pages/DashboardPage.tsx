import { TodoTree } from '../components/TodoTree';
import { CreateTodoForm } from '../components/CreateTodoForm';
import { TodoToolbar } from '../components/TodoToolbar';

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Structure for what matters.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 mb-4">
        <CreateTodoForm />
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <TodoToolbar />
        <div className="p-4">
          <TodoTree />
        </div>
      </div>
    </div>
  );
}
