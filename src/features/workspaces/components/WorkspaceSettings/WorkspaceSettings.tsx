import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Settings, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Tooltip } from '@components/ui/Tooltip';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { Spinner } from '@components/ui/Spinner';
import { ConfirmationDialog } from '@components/feedback/ConfirmationDialog';
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from '@features/workspaces/hooks/useWorkspaces';
import { useWorkspacePermission } from '@features/workspaces/hooks/useWorkspacePermission';
import { TagList } from '@features/tags/components/TagList';
import {
  createWorkspaceSchema,
  type WorkspaceFormData,
} from '@features/workspaces/schemas/workspaceSchemas';

export function WorkspaceSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('workspaces');
  const { data: workspace, isLoading } = useWorkspace(id ?? '');
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const { canEdit, canDelete } = useWorkspacePermission(id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema(t)),
    values: workspace
      ? { name: workspace.name, description: workspace.description ?? '' }
      : undefined,
  });

  if (isLoading || !workspace) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const onSubmit = async (data: WorkspaceFormData) => {
    await updateWorkspace.mutateAsync({
      id: workspace.id,
      input: {
        name: data.name,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string from form should be null
        description: data.description || null,
      },
    });
  };

  const handleDelete = () => {
    void deleteWorkspace.mutateAsync(workspace.id).then(() => {
      setShowDeleteConfirm(false);
      void navigate('/app');
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Tooltip content={t('tooltips.back')}>
          <button
            type="button"
            onClick={() => {
              void navigate('/app');
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('tooltips.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Tooltip>
        <Settings className="h-5 w-5 text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900">{t('settings.title')}</h2>
      </div>

      {/* General Settings */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.general')}</h3>
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="ws-name" className="block text-sm font-medium text-gray-700">
              {t('form.name')}
            </label>
            <Input id="ws-name" {...register('name')} disabled={!canEdit} error={!!errors.name} />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="ws-desc" className="block text-sm font-medium text-gray-700">
              {t('form.description')}
            </label>
            <Textarea id="ws-desc" {...register('description')} disabled={!canEdit} rows={3} />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty}
                isLoading={updateWorkspace.isPending}
                tooltip={!isDirty ? t('tooltips.noChanges', { ns: 'common' }) : undefined}
              >
                {t('settings.saveChanges')}
              </Button>
            </div>
          )}
        </form>
      </section>

      {/* Tags */}
      {canEdit && (
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">{t('settings.tags')}</h3>
          </div>
          <TagList workspaceId={id} />
        </section>
      )}

      {/* Danger Zone */}
      {canDelete && (
        <section className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-medium text-red-600 mb-2">{t('settings.dangerZone')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('settings.deleteWarning')}</p>
          <Button
            variant="danger"
            onClick={() => {
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('settings.deleteWorkspace')}
          </Button>
        </section>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
        }}
        title={t('settings.confirmDelete')}
        message={t('settings.confirmDeleteMessage', { name: workspace.name })}
        variant="danger"
      />
    </div>
  );
}
