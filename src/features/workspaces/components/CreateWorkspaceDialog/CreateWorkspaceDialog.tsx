import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { useCreateWorkspace } from '../../hooks/useWorkspaces';
import { useWorkspaceUiStore } from '../../stores/workspaceUiStore';
import { createWorkspaceSchema, type WorkspaceFormData } from '../../schemas/workspaceSchemas';

interface CreateWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceDialog({ isOpen, onClose }: CreateWorkspaceDialogProps) {
  const { t } = useTranslation('workspaces');
  const createWorkspace = useCreateWorkspace();
  const setActiveWorkspace = useWorkspaceUiStore((s) => s.setActiveWorkspace);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema(t)),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: WorkspaceFormData) => {
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: data.name,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string from form should be undefined
        description: data.description || undefined,
      });
      setActiveWorkspace(workspace.id);
      reset();
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('createWorkspace')}>
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
          {}
          <Input
            id="ws-name"
            {...register('name')}
            placeholder={t('form.namePlaceholder')}
            error={!!errors.name}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- dialog auto-focus is expected UX
            autoFocus
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="ws-description" className="block text-sm font-medium text-gray-700">
            {t('form.description')}
          </label>
          <Textarea
            id="ws-description"
            {...register('description')}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('form.cancel', { ns: 'common', defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit">{t('form.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}
