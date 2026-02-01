import { useState } from 'react';
import { useTags, useDeleteTag } from '../../hooks/useTags';
import { Button } from '@components/ui/Button';
import { TagBadge } from '../TagBadge';
import { TagEditModal } from './TagEditModal';
import { ConfirmationDialog } from '@components/feedback/ConfirmationDialog';
import type { Tag } from '../../types/tag';

export function TagList() {
  const { data: tags = [], isLoading } = useTags();
  const deleteMutation = useDeleteTag();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="animate-pulse">Loading tags...</div>;
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tags yet.</p>
        <p className="text-sm">Tags will appear here once you create them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center justify-between p-2 sm:p-3 gap-2 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <TagBadge tag={tag} size="md" />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-gray-400">
              {tag.usageCount || 0} tasks
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTag(tag)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingTagId(tag.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

      {editingTag && (
        <TagEditModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
        />
      )}

      {deletingTagId && (
        <ConfirmationDialog
          isOpen
          title="Delete Tag"
          message={`Delete tag "${tags.find((t) => t.id === deletingTagId)?.name}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            deleteMutation.mutate(deletingTagId);
            setDeletingTagId(null);
          }}
          onCancel={() => setDeletingTagId(null)}
        />
      )}
    </div>
  );
}
