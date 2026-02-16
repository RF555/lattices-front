import { useState, useEffect, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';
import { useActiveWorkspaceId } from '@features/workspaces/stores/workspaceUiStore';
import { todoApi } from '../../api/todoApi';
import { generateTodosExcel, type StatusFilter } from '../../utils/excelExport';
import { toast } from '@stores/toastStore';
import type { SelectOption } from '@components/ui/Select';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: StatusFilter[] = ['all', 'completed', 'uncompleted'];

const STATUS_LABEL_KEYS = {
  all: 'export.statusAll',
  completed: 'export.statusCompleted',
  uncompleted: 'export.statusUncompleted',
} as const;

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { t, i18n } = useTranslation('todos');
  const activeWorkspaceId = useActiveWorkspaceId();
  const { data: workspaces = [] } = useWorkspaces();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(activeWorkspaceId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Sync selected workspace when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedWorkspaceId(activeWorkspaceId);
      setStatusFilter('all');
    }
  }, [isOpen, activeWorkspaceId]);

  const workspaceOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [{ value: '', label: t('export.allWorkspaces') }];
    for (const ws of workspaces) {
      options.push({ value: ws.id, label: ws.name });
    }
    return options;
  }, [workspaces, t]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const workspaceId = selectedWorkspaceId ?? undefined;
      const filters = {
        includeCompleted: statusFilter !== 'uncompleted',
      };

      const todos = await todoApi.getAll(filters, workspaceId);

      await generateTodosExcel({
        todos,
        workspaces,
        selectedWorkspaceId,
        statusFilter,
        locale: i18n.language,
        t,
      });

      toast.success(t('export.success'));
      onClose();
    } catch {
      toast.error(t('export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('export.modalTitle')} className="sm:max-w-lg">
      <div className="space-y-5">
        {/* Workspace selector */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('export.workspaceLabel')}
          </label>
          <Select
            options={workspaceOptions}
            value={selectedWorkspaceId ?? ''}
            onChange={(e) => {
              setSelectedWorkspaceId(e.target.value || null);
            }}
          />
        </div>

        {/* Status filter */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('export.statusLabel')}
          </label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStatusFilter(option);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  statusFilter === option
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${option !== 'all' ? 'border-s border-gray-300' : ''}`}
              >
                {t(STATUS_LABEL_KEYS[option])}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            variant="primary"
            isLoading={isExporting}
            onClick={() => {
              void handleExport();
            }}
          >
            <FileDown className="w-4 h-4 me-2" />
            {t('export.exportButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
