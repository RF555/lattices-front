import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateTag } from '../../hooks/useTags';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { TAG_COLORS } from '../../types/tag';
import { cn } from '@lib/utils/cn';
import type { Tag } from '../../types/tag';

interface TagEditModalProps {
  tag: Tag;
  onClose: () => void;
}

export function TagEditModal({ tag, onClose }: TagEditModalProps) {
  const { t } = useTranslation('tags');
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.colorHex);

  const updateMutation = useUpdateTag();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        id: tag.id,
        input: {
          name: name.trim(),
          colorHex: color,
        },
      });
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{t('editModal.title')}</h2>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="tag-edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('editModal.nameLabel')}
            </label>
            <Input
              id="tag-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              required
            />
          </div>

          <div>
            <span
              id="tag-edit-color-label"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('editModal.colorLabel')}
            </span>
            <div className="flex gap-2" role="radiogroup" aria-labelledby="tag-edit-color-label">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full',
                    color === c && 'ring-2 ring-offset-2 ring-gray-400',
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              {t('editModal.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
