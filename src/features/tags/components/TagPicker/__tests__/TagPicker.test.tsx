/**
 * Tests for TagPicker Component
 *
 * Tests dropdown open/close, tag selection/deselection, search filtering,
 * tag creation flow, and spacebar support in tag names.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { TagPicker } from '../TagPicker';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${BASE_URL}/api/${API_VERSION}`;

const mockTags = [
  {
    id: 'tag-1',
    name: 'Work',
    color_hex: '#3b82f6',
    usage_count: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-2',
    name: 'Personal',
    color_hex: '#22c55e',
    usage_count: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const defaultProps = {
  selectedIds: [] as string[],
  onSelect: vi.fn(),
  onDeselect: vi.fn(),
};

describe('TagPicker', () => {
  beforeEach(() => {
    defaultProps.onSelect = vi.fn();
    defaultProps.onDeselect = vi.fn();

    server.use(
      http.get(`${API_URL}/tags`, () => {
        return HttpResponse.json({ data: mockTags });
      }),
    );
  });

  describe('Dropdown Open/Close', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should open dropdown when Enter is pressed on combobox', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should open dropdown when Space is pressed on closed combobox', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      combobox.focus();
      await user.keyboard(' ');

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <TagPicker {...defaultProps} />
          <button>Outside</button>
        </div>,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.click(screen.getByText('Outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Tag Selection', () => {
    it('should show available tags in the dropdown', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });
    });

    it('should call onSelect when a tag is clicked', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Work'));
      expect(defaultProps.onSelect).toHaveBeenCalledWith('tag-1');
    });

    it('should not show already-selected tags in the available list', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} selectedIds={['tag-1']} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Personal')).toBeInTheDocument();
      });

      // 'Work' should only appear as a selected badge, not in the dropdown list
      const listbox = screen.getByRole('listbox');
      expect(listbox).not.toHaveTextContent('Work');
    });
  });

  describe('Search Filtering', () => {
    it('should filter tags based on search input', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'Wor');

      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    });
  });

  describe('Spacebar in Tag Names', () => {
    it('should allow typing spaces in the search input when dropdown is open', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'My Tag');

      expect(input).toHaveValue('My Tag');
    });

    it('should create a tag with spaces in the name', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: mockTags });
        }),
        http.post(`${API_URL}/tags`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'tag-new',
                name: capturedBody.name,
                color_hex: capturedBody.color_hex ?? '#ef4444',
                usage_count: 0,
                created_at: new Date().toISOString(),
              },
            },
            { status: 201 },
          );
        }),
      );

      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'My New Tag');

      // The "create" option should appear since there's no exact match
      await waitFor(() => {
        expect(screen.getByText(/My New Tag/)).toBeInTheDocument();
      });

      // Click the create button to enter creation mode
      const createButton = screen.getByRole('button', { name: /My New Tag/i });
      await user.click(createButton);

      // Click the actual create/confirm button
      const confirmButton = screen.getByRole('button', { name: /create/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(capturedBody.name).toBe('My New Tag');
      });
    });

    it('should allow creating a tag via Enter key with spaces in name', async () => {
      const user = userEvent.setup();
      let capturedBody: Record<string, unknown> = {};

      server.use(
        http.get(`${API_URL}/tags`, () => {
          return HttpResponse.json({ data: mockTags });
        }),
        http.post(`${API_URL}/tags`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              data: {
                id: 'tag-new',
                name: capturedBody.name,
                color_hex: capturedBody.color_hex ?? '#ef4444',
                usage_count: 0,
                created_at: new Date().toISOString(),
              },
            },
            { status: 201 },
          );
        }),
      );

      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'Multi Word Tag');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(capturedBody.name).toBe('Multi Word Tag');
      });
    });
  });

  describe('Tag Creation Flow', () => {
    it('should show create option when search does not exactly match any tag', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'NewTag');

      expect(screen.getByRole('button', { name: /NewTag/i })).toBeInTheDocument();
    });

    it('should not show create option when search exactly matches an existing tag', async () => {
      const user = userEvent.setup();
      render(<TagPicker {...defaultProps} />);

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByText('Work')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'Work');

      // There should be the tag in the list, but no "create" button
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      // The create section should not be present for exact matches
      expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument();
    });
  });
});
