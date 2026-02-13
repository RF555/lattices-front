/**
 * Tests for WorkspacePicker Component
 *
 * Tests the workspace selection combobox used in todo detail editing.
 * Verifies rendering, interaction, search functionality, and workspace selection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { WorkspacePicker } from '../WorkspacePicker';

// Mock dependencies
vi.mock('@features/workspaces/hooks/useWorkspaces', () => ({
  useWorkspaces: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { useWorkspaces } from '@features/workspaces/hooks/useWorkspaces';

const mockUseWorkspaces = vi.mocked(useWorkspaces);

describe('WorkspacePicker', () => {
  const mockOnWorkspaceChange = vi.fn();

  const mockWorkspaces = [
    { id: 'ws-1', name: 'Workspace One', role: 'OWNER' as const },
    { id: 'ws-2', name: 'Workspace Two', role: 'MEMBER' as const },
    { id: 'ws-3', name: 'Another Space', role: 'MEMBER' as const },
  ];

  beforeEach(() => {
    mockOnWorkspaceChange.mockClear();

    mockUseWorkspaces.mockReturnValue({
      data: mockWorkspaces,
      isLoading: false,
    } as any);
  });

  describe('Rendering - Closed State', () => {
    it('should show current workspace name when currentWorkspaceId matches a workspace', () => {
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      expect(screen.getByText('Workspace One')).toBeInTheDocument();
    });

    it('should show "detail.workspacePersonal" when currentWorkspaceId is null', () => {
      render(
        <WorkspacePicker currentWorkspaceId={null} onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      expect(screen.getByText('detail.workspacePersonal')).toBeInTheDocument();
    });

    it('should show combobox trigger with chevron icon', () => {
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('should NOT show dropdown when closed', () => {
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Opening Dropdown', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });

    it('should open dropdown when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should open dropdown when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard(' ');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should focus search input when dropdown opens', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Dropdown Content', () => {
    it('should display search input when opened', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByPlaceholderText('detail.workspaceSearchPlaceholder')).toBeInTheDocument();
    });

    it('should display "Personal (no workspace)" option when opened', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      expect(personalOption).toBeInTheDocument();
    });

    it('should display all workspace options when opened', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const options = screen.getAllByRole('option');
      // 1 personal + 3 workspaces = 4 total
      expect(options).toHaveLength(4);

      const workspace1 = screen.getByRole('option', { name: /Workspace One/i });
      const workspace2 = screen.getByRole('option', { name: /Workspace Two/i });
      const workspace3 = screen.getByRole('option', { name: /Another Space/i });

      expect(workspace1).toBeInTheDocument();
      expect(workspace2).toBeInTheDocument();
      expect(workspace3).toBeInTheDocument();
    });

    it('should highlight current workspace option', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const currentOption = screen.getByRole('option', { name: /Workspace One/i });
      expect(currentOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should highlight personal option when currentWorkspaceId is null', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId={null} onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      expect(personalOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Selecting Workspace', () => {
    it('should call onWorkspaceChange with workspace ID when workspace is selected', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const workspace2Option = screen.getByRole('option', { name: /Workspace Two/i });
      await user.click(workspace2Option);

      expect(mockOnWorkspaceChange).toHaveBeenCalledWith('ws-2');
    });

    it('should call onWorkspaceChange with null when personal is selected', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      await user.click(personalOption);

      expect(mockOnWorkspaceChange).toHaveBeenCalledWith(null);
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const workspace2Option = screen.getByRole('option', { name: /Workspace Two/i });
      await user.click(workspace2Option);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
    });

    it('should clear search text after selection', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'Another');

      const workspace3Option = screen.getByRole('option', { name: /Another Space/i });
      await user.click(workspace3Option);

      // Reopen to check search is cleared
      await user.click(combobox);

      // Wait for dropdown to reopen
      const reopenedSearchInput = await screen.findByPlaceholderText(
        'detail.workspaceSearchPlaceholder',
      );
      expect(reopenedSearchInput).toHaveValue('');
    });
  });

  describe('Search Functionality', () => {
    it('should filter workspaces by search text', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'Another');

      // Should show only "Another Space" in options
      const options = screen.getAllByRole('option');
      // 1 personal + 1 matching workspace = 2 total
      expect(options).toHaveLength(2);

      const anotherOption = screen.getByRole('option', { name: /Another Space/i });
      expect(anotherOption).toBeInTheDocument();
    });

    it('should filter case-insensitively', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'workspace');

      // Should show both "Workspace One" and "Workspace Two"
      const options = screen.getAllByRole('option');
      // 1 personal + 2 matching workspaces = 3 total
      expect(options).toHaveLength(3);

      const workspace1 = screen.getByRole('option', { name: /Workspace One/i });
      const workspace2 = screen.getByRole('option', { name: /Workspace Two/i });

      expect(workspace1).toBeInTheDocument();
      expect(workspace2).toBeInTheDocument();
    });

    it('should show all workspaces when search is empty', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'test');

      // Clear search
      await user.clear(searchInput);

      // Should show all workspaces
      const options = screen.getAllByRole('option');
      // 1 personal + 3 workspaces = 4 total
      expect(options).toHaveLength(4);
    });

    it('should show personal option even when search has text', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'workspace');

      // Personal option should always be visible
      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      expect(personalOption).toBeInTheDocument();
    });

    it('should show only personal option when no workspaces match search', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'nonexistent');

      const options = screen.getAllByRole('option');
      // Only personal option should be visible
      expect(options).toHaveLength(1);

      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      expect(personalOption).toBeInTheDocument();
    });
  });

  describe('Closing Dropdown', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />
        </div>,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      const outside = screen.getByTestId('outside');
      await user.click(outside);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should close dropdown and clear search when Escape is pressed in search input', async () => {
      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId="ws-1" onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText('detail.workspaceSearchPlaceholder');
      await user.type(searchInput, 'test');
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      // Reopen to check search is cleared
      await user.click(combobox);

      // Wait for dropdown to reopen
      const reopenedSearchInput = await screen.findByPlaceholderText(
        'detail.workspaceSearchPlaceholder',
      );
      expect(reopenedSearchInput).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workspace list', async () => {
      mockUseWorkspaces.mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const user = userEvent.setup();
      render(
        <WorkspacePicker currentWorkspaceId={null} onWorkspaceChange={mockOnWorkspaceChange} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      // Should still show personal option
      const personalOption = screen.getByRole('option', {
        name: /detail.workspacePersonal/i,
      });
      expect(personalOption).toBeInTheDocument();

      // Should not show any workspace options
      expect(screen.queryByText('Workspace One')).not.toBeInTheDocument();
    });

    it('should show fallback text when currentWorkspaceId does not match any workspace', () => {
      render(
        <WorkspacePicker
          currentWorkspaceId="nonexistent"
          onWorkspaceChange={mockOnWorkspaceChange}
        />,
      );

      // Should show personal fallback when workspace not found
      expect(screen.getByText('detail.workspacePersonal')).toBeInTheDocument();
    });
  });
});
