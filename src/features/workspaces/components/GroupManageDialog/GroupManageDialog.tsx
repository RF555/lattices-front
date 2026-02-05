import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useCreateGroup, useUpdateGroup } from '../../hooks/useGroups';
import type { Group } from '../../types/group';

interface GroupManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  group?: Group;
}

function createGroupSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(1, t('validation.nameRequired'))
      .max(50, t('validation.nameMaxLength')),
    description: z
      .string()
      .max(200, t('validation.descriptionMaxLength'))
      .optional()
      .or(z.literal('')),
  });
}

type GroupFormData = z.infer<ReturnType<typeof createGroupSchema>>;

export function GroupManageDialog({ isOpen, onClose, workspaceId, group }: GroupManageDialogProps) {
  const { t } = useTranslation('workspaces');
  const isEdit = !!group;

  const createGroup = useCreateGroup(workspaceId);
  const updateGroup = useUpdateGroup(workspaceId, group?.id);

  const schema = createGroupSchema(t as (key: string) => string);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: group?.name || '',
        description: group?.description || '',
      });
    }
  }, [isOpen, group, reset]);

  const onSubmit = (data: GroupFormData) => {
    if (isEdit) {
      updateGroup.mutate(
        { name: data.name, description: data.description || null },
        { onSuccess: onClose }
      );
    } else {
      createGroup.mutate(
        { name: data.name, description: data.description || undefined },
        { onSuccess: onClose }
      );
    }
  };

  const isPending = createGroup.isPending || updateGroup.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('groups.edit') : t('groups.create')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('groups.name')}
          </label>
          <Input
            id="group-name"
            placeholder={t('groups.namePlaceholder')}
            {...register('name')}
            error={!!errors.name?.message}
          />
        </div>

        <div>
          <label htmlFor="group-description" className="block text-sm font-medium text-gray-700 mb-1">
            {t('groups.description')}
          </label>
          <Input
            id="group-description"
            placeholder={t('groups.descriptionPlaceholder')}
            {...register('description')}
            error={!!errors.description?.message}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? t('settings.saveChanges') : t('form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
