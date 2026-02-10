import type { TFunction } from 'i18next';
import type { Todo } from '../types/todo';
import type { Workspace } from '@features/workspaces/types/workspace';

export type StatusFilter = 'all' | 'completed' | 'uncompleted';

export interface ExportOptions {
  todos: Todo[];
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  statusFilter: StatusFilter;
  locale: string;
  t: TFunction<'todos'>;
}

/** Column definition used to build the Excel table dynamically. */
interface ColumnDef {
  key: string;
  header: string;
  width: number;
}

function getFilteredTodos(todos: Todo[], statusFilter: StatusFilter): Todo[] {
  switch (statusFilter) {
    case 'completed':
      return todos.filter((t) => t.isCompleted);
    case 'uncompleted':
      return todos.filter((t) => !t.isCompleted);
    default:
      return todos;
  }
}

function buildColumns(
  selectedWorkspaceId: string | null,
  statusFilter: StatusFilter,
  t: TFunction<'todos'>,
): ColumnDef[] {
  const cols: ColumnDef[] = [{ key: 'title', header: t('export.columns.title'), width: 35 }];

  if (selectedWorkspaceId === null) {
    cols.push({ key: 'workspace', header: t('export.columns.workspace'), width: 20 });
  }

  if (statusFilter === 'all') {
    cols.push({ key: 'completed', header: t('export.columns.completed'), width: 12 });
  }

  cols.push(
    { key: 'parent', header: t('export.columns.parent'), width: 25 },
    { key: 'description', header: t('export.columns.description'), width: 40 },
    { key: 'tags', header: t('export.columns.tags'), width: 25 },
    { key: 'createdAt', header: t('export.columns.createdAt'), width: 18 },
    { key: 'updatedAt', header: t('export.columns.updatedAt'), width: 18 },
  );

  return cols;
}

function buildRow(
  todo: Todo,
  columns: ColumnDef[],
  parentMap: Map<string, string>,
  workspaceMap: Map<string, string>,
): (string | boolean | Date)[] {
  return columns.map((col) => {
    switch (col.key) {
      case 'title':
        return todo.title;
      case 'workspace':
        return todo.workspaceId ? (workspaceMap.get(todo.workspaceId) ?? '') : '';
      case 'completed':
        return todo.isCompleted;
      case 'parent':
        return todo.parentId ? (parentMap.get(todo.parentId) ?? '') : '';
      case 'description':
        return todo.description ?? '';
      case 'tags':
        return todo.tags.map((tag) => tag.name).join(', ');
      case 'createdAt':
        return new Date(todo.createdAt);
      case 'updatedAt':
        return new Date(todo.updatedAt);
      default:
        return '';
    }
  });
}

function getFilename(selectedWorkspaceId: string | null, workspaces: Workspace[]): string {
  const date = new Date().toISOString().split('T')[0];
  if (selectedWorkspaceId === null) {
    return `lattices-tasks-all-${date}.xlsx`;
  }
  const workspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const slug = workspace?.slug ?? workspace?.name.toLowerCase().replace(/\s+/g, '-') ?? 'workspace';
  return `lattices-tasks-${slug}-${date}.xlsx`;
}

function downloadBuffer(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Excel file with a proper Excel Table and triggers a browser download.
 * Columns are dynamic based on workspace selection and status filter.
 */
export async function generateTodosExcel(options: ExportOptions): Promise<void> {
  const { todos, workspaces, selectedWorkspaceId, statusFilter, locale, t } = options;

  // Build lookup maps
  const parentMap = new Map<string, string>(todos.map((todo) => [todo.id, todo.title]));
  const workspaceMap = new Map<string, string>(workspaces.map((w) => [w.id, w.name]));

  // Filter and build data
  const filtered = getFilteredTodos(todos, statusFilter);
  const columns = buildColumns(selectedWorkspaceId, statusFilter, t);
  const rows = filtered.map((todo) => buildRow(todo, columns, parentMap, workspaceMap));

  // Lazy-load ExcelJS so it's split into a separate chunk and only fetched on export
  const ExcelJS = await import('exceljs');

  // Create workbook
  const workbook = new ExcelJS.default.Workbook();
  workbook.creator = 'Lattices';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(t('export.sheetName', { defaultValue: 'Tasks' }));

  // RTL support for Hebrew
  if (locale === 'he') {
    worksheet.views = [{ rightToLeft: true }];
  }

  // Add proper Excel Table with autofilter and striped rows
  worksheet.addTable({
    name: 'TasksTable',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: columns.map((col) => ({
      name: col.header,
      filterButton: true,
    })),
    rows,
  });

  // Set column widths and date formatting
  worksheet.columns = columns.map((col) => ({
    width: col.width,
    style:
      col.key === 'createdAt' || col.key === 'updatedAt'
        ? { numFmt: 'yyyy-mm-dd hh:mm' }
        : undefined,
  }));

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = getFilename(selectedWorkspaceId, workspaces);
  downloadBuffer(buffer as ArrayBuffer, filename);
}
