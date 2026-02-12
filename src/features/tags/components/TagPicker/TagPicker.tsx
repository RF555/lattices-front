import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils/cn';
import { useTags, useCreateTag } from '@features/tags/hooks/useTags';
import { TagBadge } from '../TagBadge';
import { TAG_COLORS } from '@features/tags/types/tag';

interface TagPickerProps {
  selectedIds: string[];
  onSelect: (tagId: string) => void;
  onDeselect: (tagId: string) => void;
  workspaceId?: string;
}

export function TagPicker({ selectedIds, onSelect, onDeselect, workspaceId }: TagPickerProps) {
  const { t } = useTranslation('tags');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tags = [] } = useTags(workspaceId);
  const createMutation = useCreateTag(workspaceId);

  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));
  const availableTags = tags.filter(
    (tag) => !selectedIds.includes(tag.id) && tag.name.toLowerCase().includes(search.toLowerCase()),
  );

  const exactMatch = tags.find((tag) => tag.name.toLowerCase() === search.toLowerCase());

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setIsCreating(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="tag-picker-listbox"
        aria-haspopup="listbox"
        tabIndex={0}
        className={cn(
          'flex flex-wrap gap-1 p-2 min-h-[38px]',
          'border rounded-md cursor-text',
          isOpen ? 'border-primary ring-1 ring-primary' : 'border-gray-300',
        )}
        onClick={() => {
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => {
              onDeselect(tag.id);
            }}
          />
        ))}
        {isOpen && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder={t('picker.searchPlaceholder')}
            className="flex-1 min-w-[100px] outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search && !exactMatch) {
                e.preventDefault();
                void handleCreateTag();
              }
            }}
          />
        )}
        {!isOpen && selectedTags.length === 0 && (
          <span className="text-gray-400 text-sm">{t('picker.placeholder')}</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="tag-picker-listbox"
          role="listbox"
          className="absolute z-dropdown w-full min-w-[200px] mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
        >
          {/* Available Tags */}
          {availableTags.length > 0 && (
            <div className="p-1">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-2 sm:py-1.5 text-left text-sm rounded hover:bg-gray-100"
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
                    {t('picker.createPrompt', { name: search })}
                  </p>
                  <div className="flex gap-1">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'w-7 h-7 sm:w-5 sm:h-5 rounded-full',
                          newTagColor === color && 'ring-2 ring-offset-1 ring-gray-400',
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setNewTagColor(color);
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 text-sm px-2 py-1 bg-primary text-white rounded hover:bg-primary/90"
                      onClick={() => {
                        void handleCreateTag();
                      }}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? t('picker.creating') : t('picker.create')}
                    </button>
                    <button
                      type="button"
                      className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => {
                        setIsCreating(false);
                      }}
                    >
                      {t('actions.cancel', { ns: 'common' })}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 text-primary"
                  onClick={() => {
                    setIsCreating(true);
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3v10M3 8h10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {t('picker.createTag', { name: search })}
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {availableTags.length === 0 && !search && (
            <div className="p-4 text-center text-sm text-gray-500">{t('picker.emptyState')}</div>
          )}
        </div>
      )}
    </div>
  );
}
