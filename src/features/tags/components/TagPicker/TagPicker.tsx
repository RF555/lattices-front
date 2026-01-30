import { useState, useRef, useEffect } from 'react';
import { cn } from '@lib/utils/cn';
import { useTags, useCreateTag } from '../../hooks/useTags';
import { TagBadge } from '../TagBadge';
import { TAG_COLORS } from '../../types/tag';

interface TagPickerProps {
  selectedIds: string[];
  onSelect: (tagId: string) => void;
  onDeselect: (tagId: string) => void;
}

export function TagPicker({ selectedIds, onSelect, onDeselect }: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tags = [] } = useTags();
  const createMutation = useCreateTag();

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));
  const availableTags = tags.filter(
    (tag) =>
      !selectedIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = tags.find(
    (tag) => tag.name.toLowerCase() === search.toLowerCase()
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
        setIsCreating(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTag = async () => {
    if (!search.trim() || exactMatch) return;

    try {
      const newTag = await createMutation.mutateAsync({
        name: search.trim(),
        colorHex: newTagColor,
      });
      onSelect(newTag.id);
      setSearch('');
      setIsCreating(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Tags */}
      <div
        className={cn(
          'flex flex-wrap gap-1 p-2 min-h-[38px]',
          'border rounded-md cursor-text',
          isOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-300'
        )}
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => onDeselect(tag.id)}
          />
        ))}
        {isOpen && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or create..."
            className="flex-1 min-w-[100px] outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search && !exactMatch) {
                e.preventDefault();
                handleCreateTag();
              }
            }}
          />
        )}
        {!isOpen && selectedTags.length === 0 && (
          <span className="text-gray-400 text-sm">Add tags...</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div className="p-1">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100"
                  onClick={() => {
                    onSelect(tag.id);
                    setSearch('');
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.colorHex }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Create Option */}
          {search && !exactMatch && (
            <div className="border-t border-gray-100 p-2">
              {isCreating ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Create tag &ldquo;{search}&rdquo;
                  </p>
                  <div className="flex gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'w-5 h-5 rounded-full',
                          newTagColor === color && 'ring-2 ring-offset-1 ring-gray-400'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 text-sm px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
                      onClick={handleCreateTag}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 text-primary"
                  onClick={() => setIsCreating(true)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3v10M3 8h10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Create &ldquo;{search}&rdquo;
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {availableTags.length === 0 && !search && (
            <div className="p-4 text-center text-sm text-gray-500">
              No tags available. Type to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
